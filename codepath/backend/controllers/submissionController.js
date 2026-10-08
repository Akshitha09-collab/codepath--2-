/**
 * controllers/submissionController.js
 * -------------------------------------
 * Manual "add a solved/failed problem" entry, and listing a student's
 * submission history. After any new submission, performance is
 * recomputed (see performanceController.recomputePerformance) so the
 * dashboard/analysis pages always reflect the latest data.
 */

const Submission = require("../models/Submission");
const { recomputePerformance } = require("./performanceController");
const { updateStreak } = require("./streakHelper");

async function addSubmission(req, res, next) {
  try {
    const { problemId, title, topic, difficulty, status, attempts, timeTaken, date } = req.body;

    const submission = await Submission.create({
      userId: req.user.id,
      problemId,
      title,
      topic,
      difficulty,
      status,
      attempts: attempts || 1,
      timeTaken: timeTaken || 0,
      date: date ? new Date(date) : new Date(),
    });

    await updateStreak(req.user.id, submission.date, status);
    await recomputePerformance(req.user.id);

    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
}

async function listSubmissions(req, res, next) {
  try {
    const { topic, status } = req.query;
    const filter = { userId: req.user.id };
    if (topic) filter.topic = new RegExp(`^${topic}$`, "i");
    if (status) filter.status = status;

    const submissions = await Submission.find(filter).sort({ date: -1 }).lean();
    res.json({ submissions });
  } catch (err) {
    next(err);
  }
}

async function recentActivity(req, res, next) {
  try {
    const submissions = await Submission.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(10)
      .lean();
    res.json({ activity: submissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { addSubmission, listSubmissions, recentActivity };
