/**
 * models/User.js
 * --------------
 * MongoDB collection: users
 * Passwords are hashed with bcrypt before saving (never stored in plaintext).
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    currentDifficultyLevel: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
    // Linked Codeforces account, set the first time the student syncs.
    // See controllers/codeforcesController.js.
    codeforcesHandle: { type: String, default: null, trim: true },
    codeforcesLastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving whenever it's new/modified
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    currentDifficultyLevel: this.currentDifficultyLevel,
    streak: this.streak,
    codeforcesHandle: this.codeforcesHandle,
    codeforcesLastSyncedAt: this.codeforcesLastSyncedAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
