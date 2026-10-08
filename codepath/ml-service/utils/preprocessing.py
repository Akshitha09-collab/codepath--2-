"""
preprocessing.py
----------------
Data preprocessing + feature engineering for CodePath's ML pipeline.

Pipeline stage: (1) Data collection -> (2) Data preprocessing -> (3) Feature extraction

Input : a list of raw submission records (dicts) for ONE student, e.g.
    {
        "problem_id": 1, "title": "Two Sum", "topic": "Arrays",
        "difficulty": "Easy", "status": "Solved", "attempts": 1,
        "time_taken": 15, "date": "2026-09-01"
    }

Output: a per-topic feature table (pandas DataFrame) that is fed into the
        classifier in model/classifier.py, plus a raw "topic stats" dict
        that the backend uses directly for dashboards/analysis (no ML needed
        for the raw stats -- only the STRONG/MEDIUM/WEAK label needs ML).
"""

import pandas as pd
import numpy as np
from datetime import datetime

DIFFICULTY_WEIGHT = {"Easy": 1, "Medium": 2, "Hard": 3}


def _safe_date(d):
    """Parse a date string defensively; fall back to None on bad data."""
    try:
        return datetime.strptime(str(d)[:10], "%Y-%m-%d")
    except (ValueError, TypeError):
        return None


def clean_submissions(raw_records):
    """
    Basic data cleaning:
      - drop rows missing required fields
      - normalize text case (topic/difficulty/status)
      - coerce numeric fields, clipping obviously bad values
    """
    if not raw_records:
        return pd.DataFrame(
            columns=["problem_id", "title", "topic", "difficulty",
                     "status", "attempts", "time_taken", "date"]
        )

    df = pd.DataFrame(raw_records)

    required = ["topic", "difficulty", "status", "attempts", "time_taken"]
    for col in required:
        if col not in df.columns:
            df[col] = np.nan

    # Drop rows with no topic (topic is the unit of analysis)
    df = df.dropna(subset=["topic"])

    df["topic"] = df["topic"].astype(str).str.strip().str.title()
    df["difficulty"] = df["difficulty"].astype(str).str.strip().str.title()
    df["status"] = df["status"].astype(str).str.strip().str.title()

    df["attempts"] = pd.to_numeric(df["attempts"], errors="coerce").fillna(1).clip(lower=1)
    df["time_taken"] = pd.to_numeric(df["time_taken"], errors="coerce").fillna(0).clip(lower=0)

    if "date" in df.columns:
        df["parsed_date"] = df["date"].apply(_safe_date)
    else:
        df["parsed_date"] = None

    # Unknown difficulty values default to "Medium" rather than crashing the pipeline
    df.loc[~df["difficulty"].isin(DIFFICULTY_WEIGHT.keys()), "difficulty"] = "Medium"

    return df.reset_index(drop=True)


def build_topic_features(df):
    """
    Feature extraction: aggregate a student's cleaned submissions into one
    feature row PER TOPIC. These features are what the Decision
    Tree / Random Forest model (see model/classifier.py) actually sees.

    Returns a DataFrame indexed by topic with columns:
        attempted, solved, failed, success_rate, avg_attempts, avg_time,
        difficulty_score, recent_success_rate, hard_ratio
    """
    if df.empty:
        return pd.DataFrame()

    rows = []
    today = datetime.now()

    for topic, grp in df.groupby("topic"):
        attempted = len(grp)
        solved_mask = grp["status"] == "Solved"
        solved = int(solved_mask.sum())
        failed = attempted - solved
        success_rate = solved / attempted if attempted else 0.0

        avg_attempts = grp["attempts"].mean()
        avg_time = grp["time_taken"].mean()

        # difficulty_score: average difficulty attempted, weighted 1-3
        difficulty_score = grp["difficulty"].map(DIFFICULTY_WEIGHT).mean()
        hard_ratio = (grp["difficulty"] == "Hard").mean()

        # "Recent performance": success rate over the last 5 submissions
        # (or all submissions if fewer than 5) ordered by date when available.
        grp_sorted = grp.sort_values("parsed_date", na_position="first")
        recent = grp_sorted.tail(5)
        recent_success_rate = (recent["status"] == "Solved").mean() if len(recent) else success_rate

        rows.append({
            "topic": topic,
            "attempted": attempted,
            "solved": solved,
            "failed": failed,
            "success_rate": round(float(success_rate), 4),
            "avg_attempts": round(float(avg_attempts), 4),
            "avg_time": round(float(avg_time), 4),
            "difficulty_score": round(float(difficulty_score), 4),
            "hard_ratio": round(float(hard_ratio), 4),
            "recent_success_rate": round(float(recent_success_rate), 4),
        })

    feat_df = pd.DataFrame(rows).set_index("topic")
    return feat_df


FEATURE_COLUMNS = [
    "success_rate", "solved", "failed", "avg_attempts",
    "avg_time", "difficulty_score", "recent_success_rate",
]


def features_for_model(feat_df):
    """Select + order the numeric columns the classifier was trained on."""
    if feat_df.empty:
        return pd.DataFrame(columns=FEATURE_COLUMNS)
    return feat_df[FEATURE_COLUMNS].fillna(0)
