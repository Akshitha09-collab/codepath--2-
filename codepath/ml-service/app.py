
"""
app.py
------
CodePath ML Service (Flask)

Architecture:
React -> Node/Express -> MongoDB
                 |
                 v
        Python ML Service
        -> Feature Extraction
        -> Skill Prediction
        -> Recommendations
"""

import os
import sys

from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.preprocessing import (
    clean_submissions,
    build_topic_features,
    features_for_model,
)

from model.classifier import (
    predict_skill_levels,
    is_model_trained,
)

from model.train_model import train as train_model_fn

from recommendation.recommender import (
    generate_recommendations,
    generate_daily_practice,
)

from utils.eval_metrics import evaluate


app = Flask(__name__)
CORS(app)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "codepath-ml-service",
        "model_trained": is_model_trained(),
    })


# --------------------------------------------------
# SHARED FEATURE EXTRACTION
# --------------------------------------------------

def _compute_features(submissions):
    """
    Convert raw submissions into topic-level features.
    """
    if not isinstance(submissions, list) or not submissions:
        return build_topic_features(clean_submissions([]))

    df = clean_submissions(submissions)
    feat_df = build_topic_features(df)

    return feat_df


# --------------------------------------------------
# ANALYZE SUBMISSIONS
# --------------------------------------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Request:
    {
        "submissions": [...]
    }

    Returns topic-wise performance statistics.
    """

    try:
        body = request.get_json(silent=True) or {}
        submissions = body.get("submissions", [])

        feat_df = _compute_features(submissions)

        if feat_df.empty:
            return jsonify({
                "topics": {},
                "message": "No usable submission history was received."
            })

        topics = {}

        for topic, row in feat_df.iterrows():
            topics[str(topic)] = {
                "attempted": int(row["attempted"]),
                "solved": int(row["solved"]),
                "failed": int(row["failed"]),
                "success_rate": round(
                    float(row["success_rate"]) * 100, 1
                ),
                "avg_attempts": float(row["avg_attempts"]),
                "avg_time": float(row["avg_time"]),
                "difficulty_score": float(
                    row["difficulty_score"]
                ),
                "recent_success_rate": round(
                    float(row["recent_success_rate"]) * 100, 1
                ),
            }

        return jsonify({"topics": topics})

    except Exception as error:
        app.logger.exception("Error in /analyze")

        return jsonify({
            "error": "Failed to analyze submissions.",
            "details": str(error),
        }), 500


# --------------------------------------------------
# PREDICT SKILL LEVELS
# --------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():
    """
    Request:
    {
        "submissions": [...]
    }

    Returns topic-wise skill classifications.
    """

    try:
        body = request.get_json(silent=True) or {}
        submissions = body.get("submissions", [])

        feat_df = _compute_features(submissions)

        if feat_df.empty:
            return jsonify({
                "skill_levels": {},
                "model_trained": is_model_trained(),
                "message": "No usable submission features found."
            })

        model_input = features_for_model(feat_df)
        skill_levels = predict_skill_levels(model_input)

        return jsonify({
            "skill_levels": skill_levels,
            "model_trained": is_model_trained(),
        })

    except Exception as error:
        app.logger.exception("Error in /predict")

        return jsonify({
            "error": "Failed to predict skill levels.",
            "details": str(error),
        }), 500


# --------------------------------------------------
# GENERATE RECOMMENDATIONS
# --------------------------------------------------

@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Request:
    {
        "submissions": [...],
        "problems": [...],
        "top_n": 5,
        "target_topic": "Graphs"
    }
    """

    try:
        body = request.get_json(silent=True) or {}

        submissions = body.get("submissions", [])
        problems = body.get("problems", [])

        try:
            top_n = int(body.get("top_n", 5))
        except (TypeError, ValueError):
            top_n = 5

        top_n = max(1, min(top_n, 50))
        target_topic = body.get("target_topic")

        # Debug information
        print("\n===== CODEPATH RECOMMENDATION DEBUG =====")
        print("Submissions received:", len(submissions)
              if isinstance(submissions, list) else "Invalid format")
        print("Problems received:", len(problems)
              if isinstance(problems, list) else "Invalid format")
        print("Target topic:", target_topic)

        if not isinstance(submissions, list):
            return jsonify({
                "recommendations": [],
                "skill_levels": {},
                "message": "Submissions must be a list."
            }), 400

        if not isinstance(problems, list):
            return jsonify({
                "recommendations": [],
                "skill_levels": {},
                "message": "Problems must be a list."
            }), 400

        if submissions:
            print("First submission fields:",
                  list(submissions[0].keys())
                  if isinstance(submissions[0], dict) else "Invalid item")

        if problems:
            print("First problem fields:",
                  list(problems[0].keys())
                  if isinstance(problems[0], dict) else "Invalid item")

        # A problem catalog is required.
        if not problems:
            print("Reason: Problem catalog is empty.")
            print("========================================\n")

            return jsonify({
                "recommendations": [],
                "skill_levels": {},
                "message": "No problems were received from the backend."
            })

        # Extract topic features from submission history.
        feat_df = _compute_features(submissions)

        print("Feature rows:", len(feat_df))
        print("Feature topics:", list(feat_df.index))

        if feat_df.empty:
            print("Reason: No topic features were generated.")
            print("========================================\n")

            return jsonify({
                "recommendations": [],
                "skill_levels": {},
                "message": (
                    "No topic features generated. "
                    "Check submission fields and status values."
                )
            })

        # Predict skill levels.
        model_input = features_for_model(feat_df)
        skill_levels = predict_skill_levels(model_input)

        print("Skill levels:", skill_levels)

        # Support multiple submission ID field names.
        solved_ids = set()
        failed_ids = set()

        for submission in submissions:
            if not isinstance(submission, dict):
                continue

            problem_id = (
                submission.get("problem_id")
                or submission.get("problemId")
                or submission.get("_id")
                or submission.get("id")
            )

            if problem_id is None:
                continue

            problem_id = str(problem_id)
            status = str(submission.get("status", "")).strip().lower()

            if status in ("solved", "accepted", "success"):
                solved_ids.add(problem_id)

            elif status in ("failed", "wrong answer", "unsolved"):
                failed_ids.add(problem_id)

        # Generate personalized recommendations.
        recs = generate_recommendations(
            skill_levels=skill_levels,
            problems=problems,
            solved_ids=solved_ids,
            failed_ids=failed_ids,
            top_n=top_n,
            target_topic=target_topic,
        )

        print("Solved problem IDs:", len(solved_ids))
        print("Failed problem IDs:", len(failed_ids))
        print("Recommendations generated:", len(recs))
        print("========================================\n")

        return jsonify({
            "recommendations": recs,
            "skill_levels": skill_levels,
            "message": (
                "Recommendations generated successfully."
                if recs
                else "No eligible problems were found for recommendation."
            )
        })

    except Exception as error:
        app.logger.exception("Error in /recommend")

        return jsonify({
            "recommendations": [],
            "error": "Failed to generate recommendations.",
            "details": str(error),
        }), 500


# --------------------------------------------------
# DAILY PRACTICE
# --------------------------------------------------

@app.route("/daily-practice", methods=["POST"])
def daily_practice():
    """
    Returns a small personalized daily practice set.
    """

    try:
        body = request.get_json(silent=True) or {}

        submissions = body.get("submissions", [])
        problems = body.get("problems", [])

        if not isinstance(submissions, list) or not isinstance(problems, list):
            return jsonify({
                "daily_practice": [],
                "message": "Submissions and problems must be lists."
            }), 400

        if not problems:
            return jsonify({
                "daily_practice": [],
                "message": "No problems were received from the backend."
            })

        feat_df = _compute_features(submissions)

        if feat_df.empty:
            return jsonify({
                "daily_practice": [],
                "message": "No usable submission history was found."
            })

        model_input = features_for_model(feat_df)
        skill_levels = predict_skill_levels(model_input)

        solved_ids = set()
        failed_ids = set()

        for submission in submissions:
            if not isinstance(submission, dict):
                continue

            problem_id = (
                submission.get("problem_id")
                or submission.get("problemId")
                or submission.get("_id")
                or submission.get("id")
            )

            if problem_id is None:
                continue

            problem_id = str(problem_id)
            status = str(submission.get("status", "")).strip().lower()

            if status in ("solved", "accepted", "success"):
                solved_ids.add(problem_id)
            elif status in ("failed", "wrong answer", "unsolved"):
                failed_ids.add(problem_id)

        daily = generate_daily_practice(
            skill_levels,
            problems,
            solved_ids,
            failed_ids,
        )

        return jsonify({
            "daily_practice": daily,
            "skill_levels": skill_levels,
        })

    except Exception as error:
        app.logger.exception("Error in /daily-practice")

        return jsonify({
            "daily_practice": [],
            "error": "Failed to generate daily practice.",
            "details": str(error),
        }), 500


# --------------------------------------------------
# TRAIN THE ML MODEL
# --------------------------------------------------

@app.route("/train", methods=["POST"])
def train_endpoint():
    try:
        metrics = train_model_fn()

        return jsonify({
            "status": "trained",
            "metrics": metrics,
        })

    except FileNotFoundError as error:
        return jsonify({
            "status": "error",
            "message": str(error),
        }), 400

    except Exception as error:
        app.logger.exception("Error in /train")

        return jsonify({
            "status": "error",
            "message": str(error),
        }), 500


# --------------------------------------------------
# EVALUATE RECOMMENDATIONS
# --------------------------------------------------

@app.route("/evaluate/recommendations", methods=["POST"])
def evaluate_recommendations():
    try:
        body = request.get_json(silent=True) or {}

        recommended_ids = body.get("recommended_ids", [])
        relevant_ids = body.get("relevant_ids", [])
        k_values = tuple(body.get("k_values", [3, 5, 10]))

        result = evaluate(
            recommended_ids,
            relevant_ids,
            k_values,
        )

        return jsonify(result)

    except Exception as error:
        app.logger.exception("Error evaluating recommendations")

        return jsonify({
            "error": "Failed to evaluate recommendations.",
            "details": str(error),
        }), 500


# --------------------------------------------------
# START SERVICE
# --------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", 8000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True,
    )
