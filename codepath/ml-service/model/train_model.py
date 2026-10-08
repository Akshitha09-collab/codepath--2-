"""
train_model.py
---------------
ML Pipeline stages 4-6: Train/test split -> Model training -> Model evaluation.

Trains a Random Forest classifier (an ensemble of Decision Trees) to map a
topic's aggregated performance features -> a skill label {Strong, Medium, Weak}.

Random Forest is chosen (per project brief) over deep learning because:
  - The dataset is small/tabular (a handful of numeric features per topic).
  - It's inherently explainable: feature_importances_ tells us WHY the model
    decided a topic is weak, which is exactly what the recommendation engine
    needs to generate human-readable explanations.
  - It's robust to the noisy, small-sample nature of a single student's
    practice history.

Run:
    python train_model.py
Produces:
    classifier.pkl   (trained model, saved with joblib)
    metrics.json     (accuracy / precision / recall / f1 on the held-out test set)
"""

import os
import json
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "training_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "classifier.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")

FEATURE_COLUMNS = [
    "success_rate", "solved", "failed", "avg_attempts",
    "avg_time", "difficulty_score", "recent_success_rate",
]
LABEL_COLUMN = "skill_level"


def train():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"{DATA_PATH} not found. Run data/generate_training_data.py first."
        )

    df = pd.read_csv(DATA_PATH)

    X = df[FEATURE_COLUMNS]
    y = df[LABEL_COLUMN]

    # Stage 4: train/test split (80/20, stratified so all 3 classes are
    # represented proportionally in both splits)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Stage 5: model training
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,          # kept shallow -> stays explainable, avoids overfitting
        min_samples_leaf=3,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # Stage 6: model evaluation
    y_pred = model.predict(X_test)

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision_macro": round(precision_score(y_test, y_pred, average="macro"), 4),
        "recall_macro": round(recall_score(y_test, y_pred, average="macro"), 4),
        "f1_macro": round(f1_score(y_test, y_pred, average="macro"), 4),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "confusion_matrix": confusion_matrix(
            y_test, y_pred, labels=model.classes_.tolist()
        ).tolist(),
        "classes": model.classes_.tolist(),
        "feature_importances": dict(zip(FEATURE_COLUMNS, model.feature_importances_.round(4).tolist())),
        "n_train": len(X_train),
        "n_test": len(X_test),
    }

    joblib.dump({"model": model, "features": FEATURE_COLUMNS}, MODEL_PATH)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    print("Model trained and saved to", MODEL_PATH)
    print(json.dumps({k: v for k, v in metrics.items()
                       if k in ("accuracy", "precision_macro", "recall_macro", "f1_macro")}, indent=2))
    print("Feature importances:", metrics["feature_importances"])

    return metrics


if __name__ == "__main__":
    train()
