"""
generate_training_data.py
--------------------------
Generates a labeled synthetic training set for the STRONG / MEDIUM / WEAK
topic-skill classifier.

Why synthetic data? For a college project there usually isn't a large
historical dataset of "ground truth" skill labels per topic. Instead we
generate feature rows that mimic real student behaviour (a student who is
"strong" in a topic tends to have a high success rate, low average attempts,
low average time, and good recent performance -- and vice-versa for "weak").
Random noise is added so the model has to genuinely learn the relationship
rather than memorize a hardcoded rule.

Run:
    python generate_training_data.py
Produces:
    training_data.csv  (used by model/train_model.py)
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

N_PER_CLASS = 400  # rows generated per class -> 1200 total, balanced classes


def make_class_rows(label, n):
    """
    Sample feature distributions per skill label. Ranges are chosen to be
    intuitive and to reflect the feature engineering in utils/preprocessing.py
    """
    if label == "Strong":
        success_rate = np.random.uniform(0.75, 1.0, n)
        avg_attempts = np.random.uniform(1.0, 1.8, n)
        avg_time = np.random.uniform(8, 25, n)
        recent_success_rate = np.clip(success_rate + np.random.uniform(-0.05, 0.1, n), 0, 1)
        solved = np.random.randint(6, 30, n)
    elif label == "Medium":
        success_rate = np.random.uniform(0.45, 0.75, n)
        avg_attempts = np.random.uniform(1.6, 3.0, n)
        avg_time = np.random.uniform(20, 45, n)
        recent_success_rate = np.clip(success_rate + np.random.uniform(-0.1, 0.1, n), 0, 1)
        solved = np.random.randint(3, 15, n)
    else:  # Weak
        success_rate = np.random.uniform(0.0, 0.45, n)
        avg_attempts = np.random.uniform(2.5, 6.0, n)
        avg_time = np.random.uniform(35, 75, n)
        recent_success_rate = np.clip(success_rate + np.random.uniform(-0.15, 0.05, n), 0, 1)
        solved = np.random.randint(0, 6, n)

    attempted = solved + np.random.randint(1, 8, n)
    attempted = np.maximum(attempted, solved + 1)
    failed = attempted - solved
    difficulty_score = np.random.uniform(1.0, 3.0, n)

    df = pd.DataFrame({
        "success_rate": np.round(success_rate, 4),
        "solved": solved,
        "failed": failed,
        "avg_attempts": np.round(avg_attempts, 4),
        "avg_time": np.round(avg_time, 4),
        "difficulty_score": np.round(difficulty_score, 4),
        "recent_success_rate": np.round(recent_success_rate, 4),
        "skill_level": label,
    })
    return df


def main():
    frames = [make_class_rows(lbl, N_PER_CLASS) for lbl in ["Strong", "Medium", "Weak"]]
    data = pd.concat(frames, ignore_index=True)
    data = data.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

    out_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    data.to_csv(out_path, index=False)
    print(f"Wrote {len(data)} rows to {out_path}")


if __name__ == "__main__":
    main()
