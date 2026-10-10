
/**
 * controllers/recommendationController.js
 * ----------------------------------------
 * Generates and stores personalized recommendations
 * using the Python ML service.
 */

const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const Recommendation = require("../models/Recommendation");
const mlClient = require("../utils/mlClient");

/**
 * Fetch a user's submissions and the available problem catalog.
 */
async function getUserData(userId) {
  const [submissions, problems] = await Promise.all([
    Submission.find({ userId }).lean(),
    Problem.find({}).lean(),
  ]);

  console.log("\n===== CODEPATH BACKEND DEBUG =====");
  console.log("User ID:", String(userId));
  console.log("Submissions found:", submissions.length);
  console.log("Problems found:", problems.length);

  if (problems.length > 0) {
    console.log("First problem:", {
      id: problems[0]._id,
      title: problems[0].title,
      topic: problems[0].topic,
      difficulty: problems[0].difficulty,
    });
  } else {
    console.log(
      "WARNING: The Problems collection returned zero documents."
    );
  }

  console.log("==================================\n");

  return { submissions, problems };
}

/**
 * GET /api/recommendations?topN=5&topic=Graphs
 */
async function getRecommendations(req, res, next) {
  try {
    const topN = Math.max(
      1,
      Math.min(Number(req.query.topN) || 5, 50)
    );

    const targetTopic = req.query.topic || null;
    const userId = req.user.id;

    const { submissions, problems } = await getUserData(userId);

    if (submissions.length === 0) {
      return res.json({
        recommendations: [],
        skillLevels: {},
        message:
          "Add or upload some coding history first so we can personalize recommendations.",
      });
    }

    if (problems.length === 0) {
      return res.status(200).json({
        recommendations: [],
        skillLevels: {},
        message:
          "The problem catalog is empty. Add problems to the MongoDB Problems collection.",
      });
    }

    const result = await mlClient.getRecommendations(
      submissions,
      problems,
      topN,
      targetTopic
    );

    const recommendations = result.recommendations || [];
    const skillLevels = result.skill_levels || {};

    const batchType = targetTopic ? "topic" : "general";

    const docs = recommendations.map((r) => ({
      userId,
      problemId: r.problem_id,
      title: r.title,
      topic: r.topic,
      difficulty: r.difficulty,
      reason: r.reason,
      link: r.link || r.url || "",
      previousAttempts: r.previous_attempts,
      isRetry: r.is_retry,
      borrowedFromTopic: r.borrowed_from_topic,
      batchType,
      generatedAt: new Date(),
    }));

    if (docs.length > 0) {
      await Recommendation.insertMany(docs);
    }

    return res.json({
      recommendations,
      skillLevels,
      message: recommendations.length
        ? "Recommendations generated successfully."
        : "No eligible recommendations were generated.",
    });
  } catch (err) {
    console.error("Error generating recommendations:", err);
    next(err);
  }
}

/**
 * GET /api/recommendations/daily
 */
async function getDailyPractice(req, res, next) {
  try {
    const userId = req.user.id;
    const { submissions, problems } = await getUserData(userId);

    if (submissions.length === 0) {
      return res.json({
        dailyPractice: [],
        message: "No submission history found.",
      });
    }

    if (problems.length === 0) {
      return res.json({
        dailyPractice: [],
        message: "The problem catalog is empty.",
      });
    }

    const result = await mlClient.getDailyPractice(
      submissions,
      problems
    );

    const dailyPractice = result.daily_practice || [];

    const docs = dailyPractice.map((r) => ({
      userId,
      problemId: r.problem_id,
      title: r.title,
      topic: r.topic,
      difficulty: r.difficulty,
      reason: r.reason,
      link: r.link || r.url || "",
      batchType: "daily",
      generatedAt: new Date(),
    }));

    if (docs.length > 0) {
      await Recommendation.insertMany(docs);
    }

    return res.json({
      dailyPractice,
      message: dailyPractice.length
        ? "Daily practice generated successfully."
        : "No daily practice problems were generated.",
    });
  } catch (err) {
    console.error("Error generating daily practice:", err);
    next(err);
  }
}

/**
 * GET /api/recommendations/history
 */
async function getRecommendationHistory(req, res, next) {
  try {
    const history = await Recommendation.find({
      userId: req.user.id,
    })
      .sort({ generatedAt: -1 })
      .limit(50)
      .lean();

    return res.json({ history });
  } catch (err) {
    console.error("Error fetching recommendation history:", err);
    next(err);
  }
}

module.exports = {
  getRecommendations,
  getDailyPractice,
  getRecommendationHistory,
};

