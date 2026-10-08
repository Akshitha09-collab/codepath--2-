/**
 * models/Problem.js
 * -----------------
 * MongoDB collection: problems
 * The catalog of coding problems the recommendation engine picks from.
 */

const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    problemId: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },
    tags: { type: [String], default: [] },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

problemSchema.index({ topic: 1, difficulty: 1 });

module.exports = mongoose.model("Problem", problemSchema);
