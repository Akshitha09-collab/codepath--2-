/**
 * utils/mlClient.js
 * -----------------
 * The ONLY place in the backend that talks to the Python ML microservice.
 * Keeping this centralized means every controller uses the same base URL,
 * timeout, and error-handling behaviour.
 *
 * Architecture reminder:
 *   Node/Express  --REST-->  Python ML Service (Flask)  --> RandomForest + recommender
 */

const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 10000,
});

/** Format a Mongo Submission doc the way the ML service expects. */
function toMlSubmission(sub) {
  return {
    problem_id: sub.problemId,
    title: sub.title,
    topic: sub.topic,
    difficulty: sub.difficulty,
    status: sub.status,
    attempts: sub.attempts,
    time_taken: sub.timeTaken,
    date: sub.date instanceof Date ? sub.date.toISOString().slice(0, 10) : sub.date,
  };
}

/** Format a Mongo Problem doc the way the ML service expects. */
function toMlProblem(p) {
  return {
    problem_id: p.problemId,
    title: p.title,
    topic: p.topic,
    difficulty: p.difficulty,
    tags: p.tags || [],
    link: p.link || "",
  };
}

async function analyzePerformance(submissions) {
  const { data } = await client.post("/analyze", {
    submissions: submissions.map(toMlSubmission),
  });
  return data; // { topics: { topic: {...stats} } }
}

async function predictSkillLevels(submissions) {
  const { data } = await client.post("/predict", {
    submissions: submissions.map(toMlSubmission),
  });
  return data; // { skill_levels: {...}, model_trained: bool }
}

async function getRecommendations(submissions, problems, topN = 5, targetTopic = null) {
  const { data } = await client.post("/recommend", {
    submissions: submissions.map(toMlSubmission),
    problems: problems.map(toMlProblem),
    top_n: topN,
    target_topic: targetTopic,
  });
  return data; // { recommendations: [...], skill_levels: {...} }
}

async function getDailyPractice(submissions, problems) {
  const { data } = await client.post("/daily-practice", {
    submissions: submissions.map(toMlSubmission),
    problems: problems.map(toMlProblem),
  });
  return data; // { daily_practice: [...] }
}

async function checkHealth() {
  const { data } = await client.get("/health");
  return data;
}

module.exports = {
  analyzePerformance,
  predictSkillLevels,
  getRecommendations,
  getDailyPractice,
  checkHealth,
  toMlSubmission,
  toMlProblem,
};
