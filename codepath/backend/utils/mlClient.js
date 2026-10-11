
/**
 * utils/mlClient.js
 * -----------------
 * Centralized connection to the Python ML microservice.
 *
 * Node.js Backend --> REST API --> Python Flask ML Service
 */

const axios = require("axios");

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000";

console.log("ML service URL configured:", ML_SERVICE_URL);

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 20000,
});

/**
 * Format a MongoDB Submission document
 * for the ML service.
 */
function toMlSubmission(sub) {
  return {
    problem_id: sub.problemId,
    title: sub.title,
    topic: sub.topic,
    difficulty: sub.difficulty,
    status: sub.status,
    attempts: sub.attempts,
    time_taken: sub.timeTaken,
    date:
      sub.date instanceof Date
        ? sub.date.toISOString().slice(0, 10)
        : sub.date,
  };
}

/**
 * Format a MongoDB Problem document
 * for the ML service.
 */
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

/**
 * Analyze user performance.
 */
async function analyzePerformance(submissions) {
  const { data } = await client.post("/analyze", {
    submissions: submissions.map(toMlSubmission),
  });

  return data;
}

/**
 * Predict skill levels.
 */
async function predictSkillLevels(submissions) {
  const { data } = await client.post("/predict", {
    submissions: submissions.map(toMlSubmission),
  });

  return data;
}

/**
 * Get personalized problem recommendations.
 */
async function getRecommendations(
  submissions,
  problems,
  topN = 5,
  targetTopic = null
) {
  const { data } = await client.post("/recommend", {
    submissions: submissions.map(toMlSubmission),
    problems: problems.map(toMlProblem),
    top_n: topN,
    target_topic: targetTopic,
  });

  return data;
}

/**
 * Get the daily practice plan.
 */
async function getDailyPractice(submissions, problems) {
  const { data } = await client.post("/daily-practice", {
    submissions: submissions.map(toMlSubmission),
    problems: problems.map(toMlProblem),
  });

  return data;
}

/**
 * Check ML service health and log connection errors.
 */
async function checkHealth() {
  try {
    const { data } = await client.get("/health");

    console.log("ML health check succeeded:", data);

    return data;
  } catch (err) {
    console.error("ML connection error:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      response: err.response?.data,
    });

    throw err;
  }
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
