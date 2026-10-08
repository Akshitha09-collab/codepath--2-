"""
classifier.py
-------------
Thin wrapper around the trained Random Forest model used at prediction time
(ML Pipeline stage 7: Prediction).

Also implements a transparent RULE-BASED FALLBACK. This matters for a
college demo: if the model file hasn't been trained yet (fresh clone,
before running train_model.py), the API should still respond sensibly
instead of crashing. The fallback uses simple, explainable thresholds on
success_rate, mirroring what the ML model learns anyway.
"""

import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "classifier.pkl")

_model_bundle = None


def _load():
    global _model_bundle
    if _model_bundle is None and os.path.exists(MODEL_PATH):
        _model_bundle = joblib.load(MODEL_PATH)
    return _model_bundle


def is_model_trained():
    return os.path.exists(MODEL_PATH)


def _rule_based_label(row):
    """Explainable fallback: thresholds on success rate + recent performance."""
    score = 0.6 * row["success_rate"] + 0.4 * row["recent_success_rate"]
    if score >= 0.7:
        return "Strong"
    if score >= 0.45:
        return "Medium"
    return "Weak"


def predict_skill_levels(feat_df):
    """
    feat_df: DataFrame indexed by topic, columns = FEATURE_COLUMNS
             (see utils/preprocessing.features_for_model)

    Returns: dict { topic: {"skill_level": str, "confidence": float,
                             "performance_score": float} }
    """
    if feat_df.empty:
        return {}

    bundle = _load()
    results = {}

    if bundle is not None:
        model = bundle["model"]
        cols = bundle["features"]
        X = feat_df[cols]
        preds = model.predict(X)
        probas = model.predict_proba(X)
        classes = model.classes_

        for topic, pred, proba_row in zip(feat_df.index, preds, probas):
            confidence = float(max(proba_row))
            results[topic] = {
                "skill_level": pred,
                "confidence": round(confidence, 4),
                "source": "ml_model",
            }
    else:
        # Fallback path -- no trained model yet
        for topic, row in feat_df.iterrows():
            results[topic] = {
                "skill_level": _rule_based_label(row),
                "confidence": None,
                "source": "rule_based_fallback",
            }

    # performance_score: a 0-100 human-readable score, independent of which
    # path produced the label, blending success rate + recent performance.
    # This is what powers e.g. "Graphs -> 33%" in the dashboard.
    for topic, row in feat_df.iterrows():
        score = 0.55 * row["success_rate"] + 0.30 * row["recent_success_rate"] + \
                0.15 * (1 - min(row["avg_attempts"] / 6.0, 1))
        results[topic]["performance_score"] = round(float(score) * 100, 1)

    return results
