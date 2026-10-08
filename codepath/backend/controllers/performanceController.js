/**
 * controllers/performanceController.js
 * ---------------------------------------
 * Bridges MongoDB submissions <-> Python ML service <-> Performance collection.
 *
 * recomputePerformance() is the core sync function: it's called after every
 * new submission (manual add or CSV upload) and:
 *   1. Fetches all of the student's submissions from MongoDB
 *   2. Sends them to the ML service's /analyze + /predict endpoints
 *   3. Upserts one Performance document per topic with the returned stats
 *      + ML-classified skill_level, appending a history snapshot so the
 *      Progress page can show "Graphs: 33% -> 52%" over time.
 */

const Submission = require("../models/Submission");
const Performance = require("../models/Performance");
const mlClient = require("../utils/mlClient");

async function recomputePerformance(userId) {
  const submissions = await Submission.find({ userId }).lean();

  if (submissions.length === 0) {
    return { topics: {} };
  }

  const [{ topics }, { skill_levels: skillLevels }] = await Promise.all([
    mlClient.analyzePerformance(submissions),
    mlClient.predictSkillLevels(submissions),
  ]);

  const results = {};

  for (const topic of Object.keys(topics)) {
    const stats = topics[topic];
    const skillInfo = skillLevels[topic] || { skill_level: "Medium", performance_score: 50 };

    const existing = await Performance.findOne({ userId, topic });

    const newHistoryEntry = {
      score: skillInfo.performance_score,
      skillLevel: skillInfo.skill_level,
      recordedAt: new Date(),
    };

    const history = existing ? [...existing.history, newHistoryEntry] : [newHistoryEntry];
    // Keep history bounded so documents don't grow unbounded over a demo
    const trimmedHistory = history.slice(-50);

    const updated = await Performance.findOneAndUpdate(
      { userId, topic },
      {
        userId,
        topic,
        attempted: stats.attempted,
        solved: stats.solved,
        failed: stats.failed,
        successRate: stats.success_rate,
        averageAttempts: stats.avg_attempts,
        averageTime: stats.avg_time,
        recentSuccessRate: stats.recent_success_rate,
        performanceScore: skillInfo.performance_score,
        skillLevel: skillInfo.skill_level,
        history: trimmedHistory,
      },
      { upsert: true, new: true }
    );

    results[topic] = updated;
  }

  return { topics: results };
}

/** GET /api/performance - full per-topic performance breakdown */
async function getPerformance(req, res, next) {
  try {
    const performance = await Performance.find({ userId: req.user.id }).sort({ topic: 1 }).lean();
    res.json({ performance });
  } catch (err) {
    next(err);
  }
}

/** POST /api/performance/recompute - manually trigger a recompute */
async function recompute(req, res, next) {
  try {
    const result = await recomputePerformance(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /api/performance/analysis - grouped strong/medium/weak + charts data */
async function getAnalysis(req, res, next) {
  try {
    const performance = await Performance.find({ userId: req.user.id }).lean();

    const strong = performance.filter((p) => p.skillLevel === "Strong").map((p) => p.topic);
    const medium = performance.filter((p) => p.skillLevel === "Medium").map((p) => p.topic);
    const weak = performance.filter((p) => p.skillLevel === "Weak").map((p) => p.topic);

    const totalAttempted = performance.reduce((sum, p) => sum + p.attempted, 0);
    const totalSolved = performance.reduce((sum, p) => sum + p.solved, 0);
    const overallSuccessRate = totalAttempted > 0
      ? Math.round((totalSolved / totalAttempted) * 1000) / 10
      : 0;

    res.json({
      performance,
      summary: { strong, medium, weak, totalAttempted, totalSolved, overallSuccessRate },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/performance/progress - history series per topic for charts */
async function getProgress(req, res, next) {
  try {
    const performance = await Performance.find({ userId: req.user.id }).lean();
    const progress = performance.map((p) => ({
      topic: p.topic,
      current: p.performanceScore,
      skillLevel: p.skillLevel,
      history: p.history,
      improvement: p.history.length >= 2
        ? Math.round((p.history[p.history.length - 1].score - p.history[0].score) * 10) / 10
        : 0,
    }));
    res.json({ progress });
  } catch (err) {
    next(err);
  }
}

module.exports = { recomputePerformance, getPerformance, recompute, getAnalysis, getProgress };
