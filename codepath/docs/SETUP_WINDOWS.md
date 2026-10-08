# CodePath — Windows Setup Guide

This guide assumes a fresh Windows 10/11 machine with nothing installed yet.

## 1. Install Prerequisites

1. **Node.js (LTS, v18+)**
   Download from https://nodejs.org and run the installer (accept defaults).
   Verify in Command Prompt:
   ```
   node -v
   npm -v
   ```

2. **Python 3.10+**
   Download from https://www.python.org/downloads/ — **during install, check
   "Add Python to PATH"**.
   Verify:
   ```
   python --version
   pip --version
   ```

3. **MongoDB Community Server**
   Download from https://www.mongodb.com/try/download/community
   Install with default settings (this also installs MongoDB Compass, a GUI, optionally).
   MongoDB will run as a Windows service automatically after install, listening on
   `mongodb://127.0.0.1:27017`.
   To verify it's running, open Command Prompt:
   ```
   mongosh
   ```
   You should see a Mongo shell prompt. Type `exit` to leave.

4. **Git** (optional, if cloning instead of extracting the zip)
   https://git-scm.com/download/win

## 2. Extract the Project

Unzip `codepath.zip` to a folder, e.g. `C:\Projects\codepath`. You should see:
```
codepath\
  backend\
  frontend\
  ml-service\
  docs\
  README.md
```

## 3. Set Up the Python ML Service

Open **Command Prompt** (or PowerShell) in `codepath\ml-service`:

```bat
cd C:\Projects\codepath\ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Generate training data and train the classifier (only needed once — a
pre-trained `classifier.pkl` is already included, but re-training regenerates
it and prints fresh evaluation metrics):
```bat
python data\generate_training_data.py
python model\train_model.py
```

Start the ML service (keep this window open):
```bat
python app.py
```
You should see: `Running on http://0.0.0.0:8000`.
Verify it's alive by visiting http://localhost:8000/health in a browser.

## 4. Set Up the Node.js Backend

Open a **new** Command Prompt window in `codepath\backend`:

```bat
cd C:\Projects\codepath\backend
copy .env.example .env
```

Open `.env` in Notepad and set a real `JWT_SECRET` (any long random string).
Leave `MONGO_URI` as `mongodb://127.0.0.1:27017/codepath` if using local MongoDB.

Install dependencies:
```bat
npm install
```

Seed the database with sample problems + a demo user + sample history:
```bat
npm run seed
```
(This requires MongoDB **and** the ML service from Step 3 to both be running.)

Start the backend (keep this window open):
```bat
npm start
```
You should see: `CodePath backend running on http://localhost:5000`.
Verify at http://localhost:5000/api/health.

## 5. Set Up the React Frontend

Open a **third** Command Prompt window in `codepath\frontend`:

```bat
cd C:\Projects\codepath\frontend
copy .env.example .env
npm install
npm run dev
```

You should see a Local URL like `http://localhost:5173/`. Open it in your browser.

## 6. Log In

Use the seeded demo account:
```
Email:    demo@codepath.com
Password: password123
```
Or register a new account and upload your own CSV from the Upload page
(`backend\data\sample_history.csv` is a ready-made sample file you can
upload again to a fresh account to see recommendations generated).

## 7. Running Everything Together (Quick Reference)

You need **3 terminal windows** running simultaneously:

| Terminal | Directory | Command |
|---|---|---|
| 1 — ML Service | `codepath\ml-service` | `venv\Scripts\activate` then `python app.py` |
| 2 — Backend | `codepath\backend` | `npm start` (or `npm run dev` for auto-reload, requires `npm install -g nodemon` or use the local one via `npx nodemon server.js`) |
| 3 — Frontend | `codepath\frontend` | `npm run dev` |

## Optional: Syncing from Codeforces

On the **Upload History** page, you can enter a Codeforces handle (e.g.
`tourist`) and click **Sync Now** instead of (or in addition to) uploading
a CSV. This calls the public Codeforces API directly from your backend, so
your machine needs normal internet access — no extra setup or API key is
required. Re-syncing later refreshes problems you've already imported
(e.g. if a retry later got Accepted) instead of duplicating them.

## Troubleshooting

- **"MongoServerError: connect ECONNREFUSED"** — MongoDB service isn't running.
  Open "Services" (services.msc) and check that "MongoDB Server" is started.
- **"ML_SERVICE_URL unreachable" in backend logs** — make sure `python app.py`
  is running in Terminal 1 before starting the backend or seeding.
- **CORS errors in the browser console** — make sure `CLIENT_ORIGIN` in
  `backend\.env` matches the URL shown by `npm run dev` in the frontend
  (default `http://localhost:5173`).
- **Port already in use** — change `PORT` in `backend\.env` or
  `ML_SERVICE_PORT` as an environment variable before running `python app.py`.
