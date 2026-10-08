/**
 * controllers/problemController.js
 * ---------------------------------
 * Read access to the problem catalog (Problems collection). Problems are
 * seeded via backend/seed.js for the demo; this controller exposes listing
 * + filtering for the /problems page.
 */

const Problem = require("../models/Problem");

async function listProblems(req, res, next) {
  try {
    const { topic, difficulty, search } = req.query;
    const filter = {};
    if (topic) filter.topic = new RegExp(`^${topic}$`, "i");
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.title = new RegExp(search, "i");

    const problems = await Problem.find(filter).sort({ topic: 1, difficulty: 1 }).lean();
    res.json({ problems });
  } catch (err) {
    next(err);
  }
}

async function listTopics(req, res, next) {
  try {
    const topics = await Problem.distinct("topic");
    res.json({ topics });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProblems, listTopics };
