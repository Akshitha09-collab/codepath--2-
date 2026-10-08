# CodePath — API Documentation

Two REST APIs make up the backend of CodePath:

1. **Node/Express API** (default `http://localhost:5000/api`) — used by the React frontend. Handles auth, persistence, and orchestrates calls to the ML service.
2. **Python ML Service API** (default `http://localhost:8000`) — used internally by the Node backend only. Stateless; does not touch MongoDB.

All Node/Express endpoints below (except `/api/auth/register` and `/api/auth/login`) require:
```
Authorization: Bearer <JWT>
```

---

## 1. Node/Express API

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Create an account. Returns `{ token, user }`. |
| POST | `/api/auth/login` | `{ email, password }` | Log in. Returns `{ token, user }`. |
| GET  | `/api/auth/me` | — | Get the current authenticated user. |
| POST | `/api/auth/logout` | — | Stateless logout (client discards token). |

### Problems

| Method | Endpoint | Query | Description |
|---|---|---|---|
| GET | `/api/problems` | `topic`, `difficulty`, `search` (all optional) | List/filter the problem catalog. |
| GET | `/api/problems/topics` | — | List distinct topics in the catalog. |

### Submissions

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| POST | `/api/submissions` | `{ problemId, title, topic, difficulty, status, attempts, timeTaken, date }` | Manually log a solved/failed/attempted problem. Triggers a performance recompute. |
| GET | `/api/submissions` | `topic`, `status` (optional) | List the current user's submission history. |
| GET | `/api/submissions/recent` | — | Last 10 submissions. |

### CSV Upload

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/upload/csv` | multipart/form-data, field `file` | Bulk-import coding history. Invalid rows are skipped and reported individually; duplicates (same problemId+date) are skipped. |

CSV columns required: `problem_id,title,topic,difficulty,status,attempts,time_taken,date`

### Codeforces Integration

Pulls a student's real submission history directly from the public
[Codeforces API](https://codeforces.com/apiHelp/methods#user.status) and
imports it the same way a CSV upload would — each imported row flows
through the same `recomputePerformance()` → ML service pipeline.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/codeforces/sync` | `{ handle }` | Fetches all submissions for the given Codeforces handle, maps them onto our topic/difficulty vocabulary, and imports/updates them. Re-syncing refreshes existing rows (e.g. a retry that later got Accepted) rather than duplicating them. |
| GET | `/api/codeforces/status` | — | Returns the currently linked handle + last sync time for the authenticated user. |

**Example `/api/codeforces/sync` response:**
```json
{
  "message": "Synced 48 problem(s) from Codeforces (tourist): 48 new, 0 updated.",
  "handle": "tourist",
  "inserted": 48,
  "updated": 0,
  "total": 48
}
```

**Mapping rules** (see `backend/utils/codeforcesClient.js`):
- **Topic**: Codeforces tags (`dp`, `graphs`, `trees`, `strings`, `two pointers`, `greedy`, `dsu`, `dfs and similar`, etc.) are mapped onto our topic vocabulary via a priority-ordered lookup, so imported problems land on topics that already exist in the Problem catalog and the recommender's topic-similarity map. Tags with no clear mapping (e.g. `math`, `implementation`, `brute force`) fall back to `Arrays`.
- **Difficulty**: Codeforces problem `rating` → `Easy` (≤1200), `Medium` (1300–1900), `Hard` (≥2000). Unrated problems default to `Medium`.
- **Status**: any submission with `verdict: "OK"` → `Solved`; otherwise `Failed`.
- **Attempts**: count of distinct submissions Codeforces recorded for that problem.
- **Problem ID**: Codeforces identifies problems by `(contestId, index)`, e.g. `(1879, "C")`, not a plain integer — these are folded into a large synthesized integer (offset above our local catalog's id range) so the two id spaces never collide.

### Performance

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/performance` | Raw per-topic performance documents. |
| POST | `/api/performance/recompute` | Force a recompute (calls the ML service). |
| GET | `/api/performance/analysis` | Grouped strong/medium/weak topics + summary stats. |
| GET | `/api/performance/progress` | Per-topic performance score history for charting improvement. |

### Recommendations

| Method | Endpoint | Query | Description |
|---|---|---|---|
| GET | `/api/recommendations` | `topN` (default 5), `topic` (optional) | Hybrid personalized recommendations with explanations. |
| GET | `/api/recommendations/daily` | — | Small daily practice set (≤3 problems). |
| GET | `/api/recommendations/history` | — | Previously generated recommendation batches. |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregated dashboard payload: totals, streak, skill groups, chart data, top recommendations, recent activity. |

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health + whether the ML service is reachable. |

---

## 2. Python ML Service API

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/health` | — | Service health + whether a trained model exists. |
| POST | `/analyze` | `{ submissions: [...] }` | Raw per-topic performance stats (no ML). |
| POST | `/predict` | `{ submissions: [...] }` | Per-topic skill level (`Strong`/`Medium`/`Weak`) + performance score, via the Random Forest classifier (falls back to rule-based thresholds if no model is trained yet). |
| POST | `/recommend` | `{ submissions, problems, top_n, target_topic? }` | Hybrid recommendation list with explanations. |
| POST | `/daily-practice` | `{ submissions, problems }` | Small daily practice set. |
| POST | `/train` | — | (Re)trains the classifier from `data/training_data.csv` and returns evaluation metrics. |
| POST | `/evaluate/recommendations` | `{ recommended_ids, relevant_ids, k_values? }` | Precision@K / Recall@K for offline evaluation. |

### Example: `/predict` request/response

Request:
```json
{
  "submissions": [
    {"problem_id": 1, "title": "Two Sum", "topic": "Arrays", "difficulty": "Easy",
     "status": "Solved", "attempts": 1, "time_taken": 12, "date": "2026-09-01"}
  ]
}
```

Response:
```json
{
  "model_trained": true,
  "skill_levels": {
    "Arrays": {
      "skill_level": "Strong",
      "confidence": 0.91,
      "performance_score": 92.4,
      "source": "ml_model"
    }
  }
}
```

### Example: recommendation reason format

```
"Recommended because your Graph success rate is 33% and you have struggled with
medium-level Graph problems. Starting at an accessible difficulty rebuilds
fundamentals before ramping up."
```
