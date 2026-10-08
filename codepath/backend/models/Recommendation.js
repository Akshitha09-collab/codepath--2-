/**
 * models/Recommendation.js
 * ------------------------
 * MongoDB collection: recommendations
 * Persists the most recently generated recommendation batch per user so the
 * dashboard/recommendations page can load instantly without recomputing,
 * and so "already recommended" problems can be tracked historically.
 */

const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problemId: { type: Number, required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    reason: { type: String, required: true },
    link: { type: String, default: "" },
    previousAttempts: { type: Number, default: 0 },
    isRetry: { type: Boolean, default: false },
    borrowedFromTopic: { type: String, default: null },
    batchType: { type: String, enum: ["general", "daily", "topic"], default: "general" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

recommendationSchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
