"""
app.py
------
CodePath ML Service (Flask).

This microservice is intentionally stateless: it does not talk to MongoDB
directly. The Node.js backend fetches a student's submissions + problem
catalog from MongoDB and POSTs them here; this service returns performance
features, skill classifications, and recommendations. This keeps the
"ML plumbing" cleanly separated from the "product/persistence" plumbing,
matching the required architecture:

    React -> Node/Express -> MongoDB
                 |
                 v
         Python ML Service -> Prediction -> Recommendation Engine

Endpoints
---------
GET  /health
POST /analyze            -> topic feature stats (no ML needed, pure aggregation)
POST /predict             -> topic skill_level classification (Strong/Medium/Weak)
POST /recommend           -> full hybrid recommendation list
POST /daily-practice       -> small daily practice set
POST /train               -> (re)trains the classifier from data/training_data.csv
POST /evaluate/recommendations -> Precision@K / Recall@K for a given rec run
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.preprocessing import clean_submissions, build_topic_features, features_for_model
from model.classifier import predict_skill_levels, is_model_trained
from model.train_model import train as train_model_fn
from recommendation.recommender import generate_recommendations, generate_daily_practice
from utils.eval_metrics import evaluate

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "codepath-ml-service",
        "model_trained": is_model_trained(),
    })


def _compute_features(submissions):
    """Shared pipeline: raw submissions -> cleaned df -> topic feature df."""
    df = clean_submissions(submissions)
    feat_df = build_topic_features(df)
    return feat_df


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Body: { "submissions": [ {problem_id, title, topic, difficulty,
                               status, attempts, time_taken, date}, ... ] }
    Returns raw per-topic performance stats (Stage 3: Feature extraction),
    useful directly for dashboards even before classification.
    """
    body = request.get_json(force=True) or {}
    submissions = body.get("submissions", [])

    feat_df = _compute_features(submissions)
    if feat_df.empty:
        return jsonify({"topics": {}})

    topics = {}
    for topic, row in feat_df.iterrows():
        topics[topic] = {
            "attempted": int(row["attempted"]),
            "solved": int(row["solved"]),
            "failed": int(row["failed"]),
            "success_rate": round(float(row["success_rate"]) * 100, 1),
            "avg_attempts": float(row["avg_attempts"]),
            "avg_time": float(row["avg_time"]),
            "difficulty_score": float(row["difficulty_score"]),
            "recent_success_rate": round(float(row["recent_success_rate"]) * 100, 1),
        }

    return jsonify({"topics": topics})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Body: { "submissions": [...] }
    Returns per-topic skill_level classification + performance_score.
    (ML Pipeline stage 7: Prediction)
    """
    body = request.get_json(force=True) or {}
    submissions = body.get("submissions", [])

    feat_df = _compute_features(submissions)
    if feat_df.empty:
        return jsonify({"skill_levels": {}, "model_trained": is_model_trained()})

    model_input = features_for_model(feat_df)
    skill_levels = predict_skill_levels(model_input)

    return jsonify({"skill_levels": skill_levels, "model_trained": is_model_trained()})


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Body: {
      "submissions": [...],
      "problems": [ {problem_id, title, topic, difficulty, tags, link}, ... ],
      "top_n": 5,
      "target_topic": "Graphs"   (optional)
    }
    Returns the hybrid recommendation list with explanations.
    (ML Pipeline stage 8: Recommendation generation)
    """
    body = request.get_json(force=True) or {}
    submissions = body.get("submissions", [])
    problems = body.get("problems", [])
    top_n = int(body.get("top_n", 5))
    target_topic = body.get("target_topic")

    feat_df = _compute_features(submissions)
    if feat_df.empty or not problems:
        return jsonify({"recommendations": []})

    model_input = features_for_model(feat_df)
    skill_levels = predict_skill_levels(model_input)

    solved_ids = {s["problem_id"] for s in submissions if str(s.get("status", "")).title() == "Solved"}
    failed_ids = {s["problem_id"] for s in submissions if str(s.get("status", "")).title() == "Failed"}

    recs = generate_recommendations(
        skill_levels, problems, solved_ids, failed_ids,
        top_n=top_n, target_topic=target_topic,
    )

    return jsonify({"recommendations": recs, "skill_levels": skill_levels})


@app.route("/daily-practice", methods=["POST"])
def daily_practice():
    """
    Body: { "submissions": [...], "problems": [...] }
    Returns a small (<=3 problem) personalized daily set.
    """
    body = request.get_json(force=True) or {}
    submissions = body.get("submissions", [])
    problems = body.get("problems", [])

    feat_df = _compute_features(submissions)
    if feat_df.empty or not problems:
        return jsonify({"daily_practice": []})

    model_input = features_for_model(feat_df)
    skill_levels = predict_skill_levels(model_input)

    solved_ids = {s["problem_id"] for s in submissions if str(s.get("status", "")).title() == "Solved"}
    failed_ids = {s["problem_id"] for s in submissions if str(s.get("status", "")).title() == "Failed"}

    daily = generate_daily_practice(skill_levels, problems, solved_ids, failed_ids)
    return jsonify({"daily_practice": daily})


@app.route("/train", methods=["POST"])
def train_endpoint():
    """Re-trains the Random Forest classifier and returns evaluation metrics."""
    try:
        metrics = train_model_fn()
        return jsonify({"status": "trained", "metrics": metrics})
    except FileNotFoundError as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route("/evaluate/recommendations", methods=["POST"])
def evaluate_recommendations():
    """
    Body: { "recommended_ids": [1,2,3,4,5], "relevant_ids": [2,4,9], "k_values": [3,5] }
    Returns Precision@K / Recall@K.
    """
    body = request.get_json(force=True) or {}
    recommended_ids = body.get("recommended_ids", [])
    relevant_ids = body.get("relevant_ids", [])
    k_values = tuple(body.get("k_values", [3, 5, 10]))

    return jsonify(evaluate(recommended_ids, relevant_ids, k_values))


if __name__ == "__main__":
    port = int(os.environ.get("ML_SERVICE_PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
