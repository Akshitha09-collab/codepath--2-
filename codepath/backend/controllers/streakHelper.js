/**
 * controllers/streakHelper.js
 * ---------------------------
 * Maintains the student's daily coding streak, shown on the Dashboard.
 * A streak continues if the student has a "Solved" submission on
 * consecutive calendar days; it resets if a day is missed.
 */

const User = require("../models/User");

function isSameDay(a, b) {
  return a.toDateString() === b.toDateString();
}

function isNextDay(prev, curr) {
  const next = new Date(prev);
  next.setDate(next.getDate() + 1);
  return isSameDay(next, curr);
}

async function updateStreak(userId, submissionDate, status) {
  if (status !== "Solved") return; // only solved problems count toward streak

  const user = await User.findById(userId);
  if (!user) return;

  const last = user.streak.lastActiveDate;

  if (!last) {
    user.streak.current = 1;
  } else if (isSameDay(last, submissionDate)) {
    // Same-day solve: streak unchanged
  } else if (isNextDay(last, submissionDate)) {
    user.streak.current += 1;
  } else if (submissionDate > last) {
    // Gap of more than a day -> streak resets to 1 (starting fresh today)
    user.streak.current = 1;
  }
  // If submissionDate is in the past relative to lastActiveDate (e.g. a
  // backfilled CSV row), don't disturb the current streak calculation.

  if (!last || submissionDate >= last) {
    user.streak.lastActiveDate = submissionDate;
  }

  user.streak.longest = Math.max(user.streak.longest, user.streak.current);
  await user.save();
}

module.exports = { updateStreak };
