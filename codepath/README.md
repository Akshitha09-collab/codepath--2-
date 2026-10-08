# CodePath — Personalized Coding Practice Recommendation System

CodePath analyzes a student's coding practice history, classifies their
DSA topic strengths/weaknesses using a Random Forest classifier, and
generates personalized, explainable problem recommendations — combining
**Machine Learning + DSA + Full-Stack Development + a Recommendation Engine**
in one project.

## Example

Given a performance profile like:

| Topic | Skill Level |
|---|---|
| Arrays | Strong |
| Strings | Strong |
| Trees | Medium |
| Graphs | Weak |
| Dynamic Programming | Weak |

CodePath recommends Graph and DP problems first, starting Easy and ramping
up, each with an explanation like:

> "Recommended because your Graph success rate is 33% and you have
> struggled with medium-level Graph problems."

## Project Structure

```
codepath/
├── frontend/       React + Vite + Tailwind + Recharts (9 pages)
├── backend/        Node.js + Express + MongoDB (Mongoose) REST API
├── ml-service/     Python + Flask ML microservice (Random Forest + recommender)
├── docs/           API docs, architecture, Windows setup guide
└── README.md       This file
```

## Quick Start

**Full setup instructions (Windows): [`docs/SETUP_WINDOWS.md`](docs/SETUP_WINDOWS.md)**

Short version (macOS/Linux similar, adjust activation commands):

```bash
# 1. ML Service
cd ml-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python data/generate_training_data.py   # optional, classifier.pkl already included
python model/train_model.py             # optional, re-trains + prints metrics
python app.py                           # runs on :8000

# 2. Backend (new terminal)
cd backend
cp .env.example .env    # then edit JWT_SECRET / MONGO_URI as needed
npm install
npm run seed             # seeds sample problems + demo user + sample history
npm start                 # runs on :5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                # runs on :5173
```

Then open http://localhost:5173 and log in with:
```
Email:    demo@codepath.com
Password: password123
```

## Features

- JWT authentication with bcrypt password hashing
- **Codeforces sync** — link a Codeforces handle and pull real submission history directly from the Codeforces API (tags/rating mapped onto our topics/difficulty)
- Manual problem-solve entry + bulk CSV history upload (with per-row error reporting)
- Topic-wise performance analysis (success rate, avg attempts/time, difficulty distribution, recent performance)
- ML-based skill classification (Strong / Medium / Weak) via an explainable Random Forest
- Hybrid recommendation engine: weak-topic prioritization, difficulty ramping, topic-similarity fallback, spaced-repetition retries — every recommendation ships with a plain-English reason
- Dashboard with charts (Recharts), streaks, and recent activity
- Daily Practice: a small personalized set refreshed from live performance
- Progress tracking with before/after performance-score history
- Model evaluation: accuracy/precision/recall/F1, plus optional Precision@K / Recall@K for recommendations

## Documentation

- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — every endpoint, request/response shapes
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagram, ML pipeline stage-by-stage, design rationale
- [`docs/SETUP_WINDOWS.md`](docs/SETUP_WINDOWS.md) — step-by-step Windows setup

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, Recharts, React Router, Axios |
| Backend | Node.js, Express.js, Mongoose, JWT, bcrypt, Multer |
| Database | MongoDB |
| ML Service | Python, Flask, Pandas, NumPy, Scikit-learn (Random Forest), Joblib |

## Notes for Reviewers

- The ML model is a **Random Forest**, deliberately chosen over deep learning per the project brief — it's explainable (feature importances drive recommendation reasons) and appropriate for small, tabular, per-student data.
- All recommendations are generated **dynamically** from live performance data — nothing is hardcoded, and already-solved problems are always excluded.
- Sample data is provided: `backend/data/sampleProblems.js` (problem catalog) and `backend/data/sample_history.csv` (a student's coding history matching the brief's exact CSV format), both loaded automatically by `npm run seed`.
