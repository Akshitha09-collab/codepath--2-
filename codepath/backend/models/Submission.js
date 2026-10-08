/**
 * models/Submission.js
 * --------------------
 * MongoDB collection: submissions
 * One record per (student, problem) attempt, either manually entered
 * via the "Add Solved Problem" form or bulk-imported via CSV upload.
 */

const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problemId: { type: Number, required: true },
    title: { type: String, required: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, enum: ["Easy", "Medium", "Hard"] },
    status: { type: String, required: true, enum: ["Solved", "Failed", "Attempted"] },
    attempts: { type: Number, required: true, min: 1, default: 1 },
    timeTaken: { type: Number, required: true, min: 0, default: 0 }, // minutes
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

submissionSchema.index({ userId: 1, topic: 1 });
submissionSchema.index({ userId: 1, problemId: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
