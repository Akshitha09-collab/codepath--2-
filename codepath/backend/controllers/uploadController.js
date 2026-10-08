/**
 * controllers/uploadController.js
 * ---------------------------------
 * Handles CSV upload of a student's coding practice history.
 * Format: problem_id,title,topic,difficulty,status,attempts,time_taken,date
 *
 * Design choice: invalid ROWS are reported and skipped rather than failing
 * the whole upload, per the brief's "Handle CSV upload errors properly."
 * Duplicate (userId, problemId, date) submissions are skipped to avoid
 * double-counting if the same file is uploaded twice.
 */

const Submission = require("../models/Submission");
const { parseCodingHistoryCsv } = require("../utils/csvParser");
const { recomputePerformance } = require("./performanceController");
const { updateStreak } = require("./streakHelper");

async function uploadCsv(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No CSV file was uploaded. Field name must be 'file'." });
    }

    const { valid, errors } = parseCodingHistoryCsv(req.file.buffer);

    if (valid.length === 0) {
      return res.status(400).json({
        message: "No valid rows found in the uploaded CSV.",
        errors,
      });
    }

    let inserted = 0;
    let skippedDuplicates = 0;

    for (const row of valid) {
      const exists = await Submission.findOne({
        userId: req.user.id,
        problemId: row.problemId,
        date: row.date,
      });
      if (exists) {
        skippedDuplicates += 1;
        continue;
      }

      const submission = await Submission.create({ ...row, userId: req.user.id });
      await updateStreak(req.user.id, submission.date, submission.status);
      inserted += 1;
    }

    await recomputePerformance(req.user.id);

    res.status(200).json({
      message: `Upload processed: ${inserted} row(s) imported, ${skippedDuplicates} duplicate(s) skipped, ${errors.length} row(s) had errors.`,
      inserted,
      skippedDuplicates,
      rowErrors: errors,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadCsv };
