# CodePath — Architecture & ML Pipeline

## System Architecture

```
                     ┌─────────────────────┐
                     │   React Frontend     │
                     │  (Vite, Tailwind,    │
                     │   Recharts)          │
                     └──────────┬───────────┘
                                │ REST (JSON, JWT)
                                ▼
                     ┌─────────────────────┐
                     │ Node.js + Express    │
                     │  Backend             │
                     │  - Auth (JWT/bcrypt) │
                     │  - CSV upload        │
                     │  - Persistence layer │
                     └──────┬───────┬───────┘
                            │       │
                     Mongoose│       │REST (JSON)
                            ▼       ▼
                  ┌───────────────┐ ┌─────────────────────┐
                  │   MongoDB     │ │ Python ML Service    │
                  │  - users      │ │  (Flask)              │
                  │  - problems   │ │  - preprocessing       │
                  │  - submissions│ │  - Random Forest       │
                  │  - recommend- │ │    classifier          │
                  │    ations     │ │  - hybrid recommender  │
                  │  - performance│ │                        │
                  └───────────────┘ └─────────────────────┘
```

The Node backend is the **only** component that talks to both MongoDB and
the ML service. The ML service is stateless and never touches MongoDB
directly — it receives submissions + the problem catalog as JSON in each
request and returns computed results. This separation means the ML service
can be scaled, redeployed, or swapped independently of the persistence layer.

## Request Flow Example: "Get my recommendations"

1. React calls `GET /api/recommendations` with the JWT in the `Authorization` header.
2. Express's `requireAuth` middleware verifies the JWT and attaches `req.user.id`.
3. `recommendationController.getRecommendations`:
   - Fetches all of the user's `Submission` docs from MongoDB.
   - Fetches the full `Problem` catalog from MongoDB.
   - POSTs both to the ML service's `/recommend` endpoint.
4. The ML service:
   - Cleans + aggregates the submissions into per-topic features (`utils/preprocessing.py`).
   - Runs the Random Forest classifier to label each topic Strong/Medium/Weak (`model/classifier.py`).
   - Runs the hybrid recommender to pick problems + generate explanations (`recommendation/recommender.py`).
   - Returns the recommendation list as JSON.
5. Express persists this batch to the `Recommendations` collection (audit trail / history) and returns it to React.
6. React renders each recommendation as a `ProblemCard` with its explanation.

## ML Pipeline (end-to-end)

| Stage | Where | What happens |
|---|---|---|
| 1. Data collection | Backend → CSV upload / manual entry | Raw submissions land in the `Submissions` collection. |
| 2. Data preprocessing | `ml-service/utils/preprocessing.py::clean_submissions` | Normalizes topic/difficulty/status casing, coerces numeric fields, handles missing/bad values defensively. |
| 3. Feature extraction | `ml-service/utils/preprocessing.py::build_topic_features` | Aggregates per-topic: attempted, solved, failed, success_rate, avg_attempts, avg_time, difficulty_score, recent_success_rate. |
| 4. Train/test split | `ml-service/model/train_model.py` | 80/20 stratified split of the (synthetic, labeled) training set. |
| 5. Model training | `ml-service/model/train_model.py` | Random Forest (150 trees, max_depth=6, class_weight="balanced"). |
| 6. Model evaluation | `ml-service/model/train_model.py` | Accuracy, macro precision/recall/F1, confusion matrix, feature importances — saved to `metrics.json`. |
| 7. Prediction | `ml-service/model/classifier.py::predict_skill_levels` | Classifies each of the *current* student's topics into Strong/Medium/Weak with a confidence score. Falls back to explainable rule-based thresholds if no model file exists yet. |
| 8. Recommendation generation | `ml-service/recommendation/recommender.py` | Hybrid rule-based + content-based engine (see below). |

## Why Random Forest (not deep learning)?

- The feature space is small (7 numeric features per topic) and tabular — exactly what tree ensembles are built for.
- **Explainability**: `feature_importances_` directly tells us which signals (success rate, recent performance, avg attempts, etc.) drove a Weak/Strong classification — this is what lets the recommendation engine generate human-readable reasons.
- Robust to the small-sample, noisy nature of a single student's history without needing thousands of examples per class.
- Appropriate scope for a college-level project: implementable, explainable, and fast to train/retrain (`POST /train`).

## Hybrid Recommendation Engine Design

The recommender (`recommendation/recommender.py`) combines three signals:

1. **Rule-based prioritization** — Weak topics are recommended before Medium, before Strong. Within a topic, a difficulty *ramp* is chosen based on skill level (e.g. Weak → Easy, Easy, Medium, Medium, Medium).
2. **History awareness** — Already-solved problems are never recommended. Previously-failed problems are eligible for a spaced-repetition retry (flagged `is_retry`) when no fresh problem exists at the needed difficulty.
3. **Topic-similarity fallback** — If a topic's problem pool is exhausted, the engine borrows from a related topic (e.g. Graphs ↔ Trees, DP ↔ Greedy) via a hand-authored similarity map, flagged `borrowed_from_topic`.

Every recommendation includes a natural-language `reason` referencing the
student's actual performance numbers for that topic — generated dynamically,
never hardcoded.

## Evaluation Metrics

- **Classifier**: accuracy, precision/recall/F1 (macro-averaged across Strong/Medium/Weak), confusion matrix — via `POST /train`, saved to `ml-service/model/metrics.json`.
- **Recommendations** (optional, for a project report): Precision@K / Recall@K via `POST /evaluate/recommendations`, comparing what was recommended against problems the student later actually solved.

## Codeforces Integration

`backend/utils/codeforcesClient.js` calls the public
`GET https://codeforces.com/api/user.status?handle=<handle>` endpoint
directly from the Node backend (no API key needed for this read-only,
public method). Codeforces submissions don't carry a "topic" or our
Easy/Medium/Hard difficulty label the way our schema expects, so they're
translated on the way in:

- **Tags → Topic**: a priority-ordered lookup table maps Codeforces tags
  (`dp`, `graphs`, `trees`, `two pointers`, ...) onto the same topic
  vocabulary used by the local Problem catalog, so imported history feeds
  the ML classifier and recommender exactly like manually-entered data.
- **Rating → Difficulty**: `rating <= 1200` → Easy, `1300-1900` → Medium,
  `>= 2000` → Hard.
- **Submissions → one row per problem**: Codeforces returns every
  individual submission; these are grouped by `(contestId, index)` into one
  Submission row per problem, with `attempts` = submission count and
  `status` = Solved if any submission has `verdict: "OK"`.

This keeps the rest of the pipeline (preprocessing → classification →
recommendation) completely unaware of where a submission came from —
Codeforces-synced, CSV-uploaded, and manually-entered rows are
indistinguishable once they're in the `Submissions` collection.

## Database Schema Summary

See `docs/API_DOCUMENTATION.md` for endpoint-level detail. Collections:
`users`, `problems`, `submissions`, `recommendations`, `performance` (see
Mongoose schemas under `backend/models/` for exact fields, types, and indexes).
