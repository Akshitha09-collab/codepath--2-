/**
 * config/db.js
 * ------------
 * Establishes the MongoDB connection using Mongoose. Called once from
 * server.js on startup. Fails fast with a clear message if the URI
 * is missing or unreachable, which is much easier to debug than a
 * silent hang for a college-project setup.
 */

const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Copy .env.example to .env and configure it.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
