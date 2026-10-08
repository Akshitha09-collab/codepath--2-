/**
 * models/Performance.js
 * ---------------------
 * MongoDB collection: performance
 * A snapshot, per (user, topic), of computed performance stats + the
 * ML-classified skill level. Recomputed after every new submission /
 * CSV upload so progress-over-time can be charted (see Progress page).
 */

const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    attempted: { type: Number, default: 0 },
    solved: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }, // 0-100
    averageAttempts: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    recentSuccessRate: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 }, // 0-100, drives dashboard charts
    skillLevel: { type: String, enum: ["Strong", "Medium", "Weak"], default: "Medium" },
    // history of performanceScore snapshots over time, for the Progress page
    history: [
      {
        score: Number,
        skillLevel: String,
        recordedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

performanceSchema.index({ userId: 1, topic: 1 }, { unique: true });

module.exports = mongoose.model("Performance", performanceSchema);
