/**
 * utils/codeforcesClient.js
 * ---------------------------
 * Fetches a student's real submission history from the public Codeforces
 * API (https://codeforces.com/apiHelp/methods#user.status) and converts it
 * into rows matching our Submission schema, so it can be imported exactly
 * like a manually-entered or CSV-uploaded problem.
 *
 * Codeforces does not have a "topic" or difficulty-label field the way our
 * app does -- it has `tags` (strings like "dp", "graphs", "two pointers")
 * and a numeric `rating` (problem difficulty, roughly 800-3500). We map
 * both onto OUR vocabulary so imported problems flow through the exact
 * same ML + recommendation pipeline as everything else:
 *
 *   CF tags    -> our topic   (Arrays, Strings, Trees, Graphs, Dynamic
 *                               Programming, Greedy, Recursion, Hashing,
 *                               Two Pointers, Stacks, ...)
 *   CF rating  -> our difficulty (Easy <=1200, Medium 1300-1900, Hard >=2000)
 */

const axios = require("axios");

const CF_API_BASE = "https://codeforces.com/api";

// Ordered list: the FIRST tag (in this priority order, not the array order
// Codeforces happens to return) found on a problem decides its topic. This
// keeps every imported problem mapped onto a topic that actually exists in
// our Problem catalog / TOPIC_SIMILARITY map, so recommendations stay
// meaningful instead of landing on an orphan topic with no problems.
const TAG_TOPIC_PRIORITY = [
  ["dp", "Dynamic Programming"],
  ["graphs", "Graphs"],
  ["shortest paths", "Graphs"],
  ["graph matchings", "Graphs"],
  ["dsu", "Graphs"],
  ["dfs and similar", "Graphs"],
  ["trees", "Trees"],
  ["strings", "Strings"],
  ["string suffix structures", "Strings"],
  ["hashing", "Hashing"],
  ["two pointers", "Two Pointers"],
  ["greedy", "Greedy"],
  ["divide and conquer", "Recursion"],
  ["recursion", "Recursion"],
  ["data structures", "Stacks"],
  ["binary search", "Arrays"],
  ["sortings", "Arrays"],
  ["implementation", "Arrays"],
  ["math", "Arrays"],
  ["brute force", "Arrays"],
];

const DEFAULT_TOPIC = "Arrays"; // generic fallback when no known tag matches

function mapTagsToTopic(tags = []) {
  for (const [tag, topic] of TAG_TOPIC_PRIORITY) {
    if (tags.includes(tag)) return topic;
  }
  return DEFAULT_TOPIC;
}

function mapRatingToDifficulty(rating) {
  if (!rating) return "Medium"; // unrated problems (common in Div.3/4 extras) default to Medium
  if (rating <= 1200) return "Easy";
  if (rating <= 1900) return "Medium";
  return "Hard";
}

function estimateDefaultTime(rating) {
  // Used only when we have a single submission for a problem and therefore
  // no real elapsed-time signal to measure (see transformSubmissions).
  if (!rating) return 20;
  if (rating <= 1200) return 15;
  if (rating <= 1900) return 30;
  return 50;
}

/**
 * Codeforces problem ids are (contestId, index) pairs, e.g. (1879, "C"),
 * not plain integers like our Problem catalog uses. We fold them into a
 * single large integer, offset well above our local catalog's id range
 * (1-100ish) so the two id spaces never collide for the same user.
 */
function synthesizeProblemId(problem) {
  const contestId = problem.contestId || 0;
  const index = String(problem.index || "A");
  let letterPart = 0;
  for (const ch of index) {
    letterPart = (letterPart * 100 + ch.charCodeAt(0)) % 1000;
  }
  return 900000000 + (contestId % 100000) * 1000 + letterPart;
}

/** GET /user.status -- returns ALL of a handle's submissions (contest + practice). */
async function fetchCodeforcesSubmissions(handle) {
  let response;
  try {
    response = await axios.get(`${CF_API_BASE}/user.status`, {
      params: { handle, from: 1, count: 10000 },
      timeout: 15000,
    });
  } catch (err) {
    const wrapped = new Error(
      "Could not reach the Codeforces API. Check your internet connection and try again."
    );
    wrapped.statusCode = 502;
    throw wrapped;
  }

  const { data } = response;
  if (data.status !== "OK") {
    // Codeforces returns HTTP 200 even on logical failure (bad handle, etc.)
    // with { status: "FAILED", comment: "..." } -- surface that comment.
    const err = new Error(data.comment || "Codeforces API request failed.");
    err.statusCode = 400;
    throw err;
  }

  return data.result; // array of Submission objects
}

/**
 * Groups raw Codeforces submissions by problem and converts each group into
 * ONE row matching our Submission schema. A problem attempted 3 times before
 * being solved becomes a single row with attempts=3, status="Solved".
 */
function transformSubmissions(rawSubmissions) {
  const byProblem = new Map();

  // Codeforces returns newest-first; reverse to chronological order so
  // "first attempt -> solved attempt" elapsed-time estimates make sense.
  const chronological = [...rawSubmissions].reverse();

  for (const sub of chronological) {
    const problem = sub.problem;
    if (!problem || !problem.name) continue;

    const key = `${problem.contestId || "gym"}-${problem.index}`;
    if (!byProblem.has(key)) {
      byProblem.set(key, { problem, attempts: [] });
    }
    byProblem.get(key).attempts.push(sub);
  }

  const rows = [];
  for (const { problem, attempts } of byProblem.values()) {
    const solvedAttempt = attempts.find((a) => a.verdict === "OK");
    const status = solvedAttempt ? "Solved" : "Failed";

    const firstAttempt = attempts[0];
    const relevantAttempt = solvedAttempt || attempts[attempts.length - 1];

    const minutesElapsed = Math.max(
      1,
      Math.round((relevantAttempt.creationTimeSeconds - firstAttempt.creationTimeSeconds) / 60)
    );
    // Only trust the elapsed-time signal when there were multiple attempts;
    // a single submission has no gap to measure, so fall back to a
    // difficulty-based estimate instead of reporting 0/1 minute.
    const timeTaken = attempts.length > 1 ? minutesElapsed : estimateDefaultTime(problem.rating);

    rows.push({
      problemId: synthesizeProblemId(problem),
      title: problem.name,
      topic: mapTagsToTopic(problem.tags),
      difficulty: mapRatingToDifficulty(problem.rating),
      status,
      attempts: attempts.length,
      timeTaken,
      date: new Date(relevantAttempt.creationTimeSeconds * 1000),
      link: problem.contestId
        ? `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
        : "",
    });
  }

  return rows;
}

module.exports = {
  fetchCodeforcesSubmissions,
  transformSubmissions,
  mapTagsToTopic,
  mapRatingToDifficulty,
  synthesizeProblemId,
};
