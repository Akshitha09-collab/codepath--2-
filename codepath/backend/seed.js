/**
 * seed.js
 * -------
 * Seeds MongoDB with:
 *   1. The sample problem catalog (data/sampleProblems.js)
 *   2. A demo user (demo@codepath.com / password123) with the sample
 *      coding history (data/sample_history.csv) already imported, so
 *      graders/reviewers can log in and see a populated dashboard
 *      immediately without manually uploading a CSV first.
 *
 * Run: npm run seed   (make sure MongoDB is running and .env is configured)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Problem = require("./models/Problem");
const Submission = require("./models/Submission");
const Performance = require("./models/Performance");
const Recommendation = require("./models/Recommendation");

const sampleProblems = require("./data/sampleProblems");
const { parseCodingHistoryCsv } = require("./utils/csvParser");
const { recomputePerformance } = require("./controllers/performanceController");
const { updateStreak } = require("./controllers/streakHelper");

const DEMO_EMAIL = "demo@codepath.com";
const DEMO_PASSWORD = "password123";

async function seed() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Problem.deleteMany({});
  await Submission.deleteMany({ userId: { $exists: true } }); // full reset for demo purposes
  await Performance.deleteMany({});
  await Recommendation.deleteMany({});
  await User.deleteOne({ email: DEMO_EMAIL });

  console.log(`Seeding ${sampleProblems.length} problems...`);
  await Problem.insertMany(sampleProblems);

  console.log("Creating demo user...");
  const demoUser = await User.create({
    name: "Demo Student",
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  console.log("Importing sample coding history for demo user...");
  const csvPath = path.join(__dirname, "data", "sample_history.csv");
  const csvBuffer = fs.readFileSync(csvPath);
  const { valid, errors } = parseCodingHistoryCsv(csvBuffer);

  if (errors.length > 0) {
    console.warn("Some sample rows had errors:", errors);
  }

  for (const row of valid) {
    const submission = await Submission.create({ ...row, userId: demoUser._id });
    await updateStreak(demoUser._id, submission.date, submission.status);
  }

  console.log("Computing initial performance + skill levels via ML service...");
  await recomputePerformance(demoUser._id);

  console.log("\nSeed complete!");
  console.log("-----------------------------------------");
  console.log(`Demo login  ->  email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`);
  console.log(`Problems seeded: ${sampleProblems.length}`);
  console.log(`Submissions imported: ${valid.length}`);
  console.log("-----------------------------------------");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  console.error("Make sure MongoDB is running and the Python ML service (app.py) is running on ML_SERVICE_URL before seeding.");
  process.exit(1);
});
