/**
 * controllers/dashboardController.js
 * -------------------------------------
 * Single aggregated endpoint that powers the main Dashboard page:
 * total solved, streak, overall success rate, strong/medium/weak topic
 * lists, top recommendations, and recent activity -- all in one call to
 * minimize round-trips from the frontend.
 */

const User = require("../models/User");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const Performance = require("../models/Performance");
const mlClient = require("../utils/mlClient");

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const [user, submissions, performance, recentActivity] = await Promise.all([
      User.findById(userId),
      Submission.find({ userId }).lean(),
      Performance.find({ userId }).lean(),
      Submission.find({ userId }).sort({ date: -1 }).limit(6).lean(),
    ]);

    const totalSolved = submissions.filter((s) => s.status === "Solved").length;
    const totalAttempted = submissions.length;
    const overallSuccessRate = totalAttempted > 0
      ? Math.round((totalSolved / totalAttempted) * 1000) / 10
      : 0;

    const strong = performance.filter((p) => p.skillLevel === "Strong").map((p) => p.topic);
    const medium = performance.filter((p) => p.skillLevel === "Medium").map((p) => p.topic);
    const weak = performance.filter((p) => p.skillLevel === "Weak").map((p) => p.topic);

    let topRecommendations = [];
    if (submissions.length > 0) {
      const problems = await Problem.find().lean();
      const { recommendations } = await mlClient.getRecommendations(submissions, problems, 5, null);
      topRecommendations = recommendations;
    }

    res.json({
      totalSolved,
      totalAttempted,
      overallSuccessRate,
      streak: user.streak,
      strongTopics: strong,
      mediumTopics: medium,
      weakTopics: weak,
      topicPerformance: performance.map((p) => ({
        topic: p.topic,
        performanceScore: p.performanceScore,
        skillLevel: p.skillLevel,
        successRate: p.successRate,
      })),
      recommendedProblems: topRecommendations,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
