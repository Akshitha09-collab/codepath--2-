
/**
 * seed.js
 * -------
 * Safely populates the CodePath problem catalog.
 *
 * Features:
 * 1. Inserts missing sample problems.
 * 2. Updates existing problems using problemId.
 * 3. Preserves existing users and submissions.
 * 4. Does not delete performance or recommendation records.
 *
 * Run:
 *   node seed.js
 *
 * Make sure MongoDB is configured in your backend .env file.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const Problem = require("./models/Problem");
const sampleProblems = require("./data/sampleProblems");

async function seed() {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("\n==================================");
    console.log("   CODEPATH PROBLEM CATALOG SEED");
    console.log("==================================\n");

    console.log(
      `Sample problems available: ${sampleProblems.length}`
    );

    let added = 0;
    let updated = 0;
    let unchanged = 0;

    // Insert missing problems or update existing ones.
    for (const problem of sampleProblems) {
      const result = await Problem.updateOne(
        { problemId: problem.problemId },
        { $set: problem },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        added++;
      } else if (result.modifiedCount > 0) {
        updated++;
      } else {
        unchanged++;
      }
    }

    // Verify the final problem count.
    const totalProblems = await Problem.countDocuments();

    console.log("\nProblem catalog updated successfully!");
    console.log("----------------------------------");
    console.log("New problems added:", added);
    console.log("Existing problems updated:", updated);
    console.log("Unchanged problems:", unchanged);
    console.log("Total problems in MongoDB:", totalProblems);
    console.log("----------------------------------");

    console.log(
      "\nExisting users and submissions were not deleted."
    );
    console.log("You can now test CodePath recommendations.");

  } catch (error) {
    console.error("\nProblem catalog seeding failed:");
    console.error(error.message);
    process.exitCode = 1;

  } finally {
    // Close the MongoDB connection.
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

seed();