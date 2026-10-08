/**
 * utils/csvParser.js
 * ------------------
 * Parses + validates an uploaded coding-history CSV.
 * Expected header: problem_id,title,topic,difficulty,status,attempts,time_taken,date
 *
 * Returns { valid: [...rows], errors: [{row, message}] } so the upload
 * controller can report exactly which rows failed and why, rather than
 * rejecting the whole file for one bad line.
 */

const { parse } = require("csv-parse/sync");

const REQUIRED_COLUMNS = [
  "problem_id", "title", "topic", "difficulty", "status", "attempts", "time_taken", "date",
];
const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const VALID_STATUSES = new Set(["Solved", "Failed", "Attempted"]);

function parseCodingHistoryCsv(csvBuffer) {
  let records;
  try {
    records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    return { valid: [], errors: [{ row: 0, message: `Malformed CSV: ${err.message}` }] };
  }

  if (records.length === 0) {
    return { valid: [], errors: [{ row: 0, message: "CSV file is empty." }] };
  }

  const headerCols = Object.keys(records[0]);
  const missingCols = REQUIRED_COLUMNS.filter((c) => !headerCols.includes(c));
  if (missingCols.length > 0) {
    return {
      valid: [],
      errors: [{ row: 0, message: `Missing required column(s): ${missingCols.join(", ")}` }],
    };
  }

  const valid = [];
  const errors = [];

  records.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for header row
    const rowErrors = [];

    const problemId = Number(row.problem_id);
    if (!Number.isFinite(problemId) || problemId <= 0) {
      rowErrors.push("problem_id must be a positive number");
    }

    if (!row.title || !row.title.trim()) {
      rowErrors.push("title is required");
    }
    if (!row.topic || !row.topic.trim()) {
      rowErrors.push("topic is required");
    }

    const difficulty = (row.difficulty || "").trim();
    if (!VALID_DIFFICULTIES.has(difficulty)) {
      rowErrors.push(`difficulty must be one of Easy/Medium/Hard (got "${row.difficulty}")`);
    }

    const status = (row.status || "").trim();
    if (!VALID_STATUSES.has(status)) {
      rowErrors.push(`status must be one of Solved/Failed/Attempted (got "${row.status}")`);
    }

    const attempts = Number(row.attempts);
    if (!Number.isFinite(attempts) || attempts < 1) {
      rowErrors.push("attempts must be a number >= 1");
    }

    const timeTaken = Number(row.time_taken);
    if (!Number.isFinite(timeTaken) || timeTaken < 0) {
      rowErrors.push("time_taken must be a non-negative number");
    }

    const date = new Date(row.date);
    if (isNaN(date.getTime())) {
      rowErrors.push(`date is invalid (got "${row.date}"), expected YYYY-MM-DD`);
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") });
      return;
    }

    valid.push({
      problemId,
      title: row.title.trim(),
      topic: row.topic.trim(),
      difficulty,
      status,
      attempts,
      timeTaken,
      date,
    });
  });

  return { valid, errors };
}

module.exports = { parseCodingHistoryCsv, REQUIRED_COLUMNS };
