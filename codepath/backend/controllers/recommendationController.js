/**
 * controllers/recommendationController.js
 * ------------------------------------------
 * Generates and persists personalized recommendations by delegating the
 * actual ML/recommendation logic to the Python service, then saving the
 * result into the Recommendations collection so the frontend has a
 * consistent, dynamic (never hardcoded) source of truth.
 */

const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const Recommendation = require("../models/Recommendation");
const mlClient = require("../utils/mlClient");

/** GET /api/recommendations?topN=5&topic=Graphs */
async function getRecommendations(req, res, next) {
  try {
    const topN = Number(req.query.topN) || 5;
    const targetTopic = req.query.topic || null;

    const [submissions, problems] = await Promise.all([
      Submission.find({ userId: req.user.id }).lean(),
      Problem.find().lean(),
    ]);

    if (submissions.length === 0) {
      return res.json({
        recommendations: [],
        message: "Add or upload some coding history first so we can personalize recommendations.",
      });
    }

    const { recommendations, skill_levels: skillLevels } = await mlClient.getRecommendations(
      submissions, problems, topN, targetTopic
    );

    // Persist this batch (Recommendations collection) -- dynamically
    // generated every call, never hardcoded.
    const batchType = targetTopic ? "topic" : "general";
    const docs = recommendations.map((r) => ({
      userId: req.user.id,
      problemId: r.problem_id,
      title: r.title,
      topic: r.topic,
      difficulty: r.difficulty,
      reason: r.reason,
      link: r.link,
      previousAttempts: r.previous_attempts,
      isRetry: r.is_retry,
      borrowedFromTopic: r.borrowed_from_topic,
      batchType,
      generatedAt: new Date(),
    }));

    if (docs.length > 0) {
      await Recommendation.insertMany(docs);
    }

    res.json({ recommendations, skillLevels });
  } catch (err) {
    next(err);
  }
}

/** GET /api/recommendations/daily */
async function getDailyPractice(req, res, next) {
  try {
    const [submissions, problems] = await Promise.all([
      Submission.find({ userId: req.user.id }).lean(),
      Problem.find().lean(),
    ]);

    if (submissions.length === 0) {
      return res.json({ dailyPractice: [] });
    }

    const { daily_practice: dailyPractice } = await mlClient.getDailyPractice(submissions, problems);

    const docs = dailyPractice.map((r) => ({
      userId: req.user.id,
      problemId: r.problem_id,
      title: r.title,
      topic: r.topic,
      difficulty: r.difficulty,
      reason: r.reason,
      link: r.link,
      batchType: "daily",
      generatedAt: new Date(),
    }));
    if (docs.length > 0) {
      await Recommendation.insertMany(docs);
    }

    res.json({ dailyPractice });
  } catch (err) {
    next(err);
  }
}

/** GET /api/recommendations/history - previously generated recommendation batches */
async function getRecommendationHistory(req, res, next) {
  try {
    const history = await Recommendation.find({ userId: req.user.id })
      .sort({ generatedAt: -1 })
      .limit(50)
      .lean();
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendations, getDailyPractice, getRecommendationHistory };
