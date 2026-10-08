/**
 * controllers/codeforcesController.js
 * --------------------------------------
 * Lets a student link their Codeforces handle and pull their real
 * submission history in automatically, instead of (or alongside) manual
 * entry / CSV upload. Imported rows go through the exact same
 * recomputePerformance() -> ML service pipeline as any other submission.
 */

const User = require("../models/User");
const Submission = require("../models/Submission");
const { fetchCodeforcesSubmissions, transformSubmissions } = require("../utils/codeforcesClient");
const { recomputePerformance } = require("./performanceController");
const { updateStreak } = require("./streakHelper");

/** POST /api/codeforces/sync  Body: { handle } */
async function syncCodeforces(req, res, next) {
  try {
    const { handle } = req.body;
    if (!handle || !handle.trim()) {
      return res.status(400).json({ message: "A Codeforces handle is required." });
    }
    const cleanHandle = handle.trim();

    const rawSubmissions = await fetchCodeforcesSubmissions(cleanHandle);
    const rows = transformSubmissions(rawSubmissions);

    if (rows.length === 0) {
      return res.status(400).json({
        message: `No submissions found for Codeforces handle "${cleanHandle}". Nothing to import.`,
      });
    }

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = await Submission.findOne({ userId: req.user.id, problemId: row.problemId });

      if (existing) {
        // Re-sync: refresh status/attempts/time in case the student solved
        // it (or tried again) on Codeforces since the last sync, rather
        // than silently skipping it like a true duplicate.
        existing.status = row.status;
        existing.attempts = row.attempts;
        existing.timeTaken = row.timeTaken;
        existing.date = row.date;
        await existing.save();
        updated += 1;
      } else {
        const submission = await Submission.create({ ...row, userId: req.user.id });
        await updateStreak(req.user.id, submission.date, submission.status);
        inserted += 1;
      }
    }

    await User.findByIdAndUpdate(req.user.id, {
      codeforcesHandle: cleanHandle,
      codeforcesLastSyncedAt: new Date(),
    });

    await recomputePerformance(req.user.id);

    res.json({
      message: `Synced ${rows.length} problem(s) from Codeforces (${cleanHandle}): ${inserted} new, ${updated} updated.`,
      handle: cleanHandle,
      inserted,
      updated,
      total: rows.length,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

/** GET /api/codeforces/status - currently linked handle + last sync time */
async function getCodeforcesStatus(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      handle: user.codeforcesHandle || null,
      lastSyncedAt: user.codeforcesLastSyncedAt || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { syncCodeforces, getCodeforcesStatus };
