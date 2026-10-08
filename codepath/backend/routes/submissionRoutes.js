/**
 * routes/submissionRoutes.js
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const requireAuth = require("../middleware/auth");
const { addSubmission, listSubmissions, recentActivity } = require("../controllers/submissionController");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

router.post(
  "/",
  requireAuth,
  [
    body("problemId").isNumeric().withMessage("problemId must be a number"),
    body("title").trim().notEmpty().withMessage("title is required"),
    body("topic").trim().notEmpty().withMessage("topic is required"),
    body("difficulty").isIn(["Easy", "Medium", "Hard"]).withMessage("difficulty must be Easy/Medium/Hard"),
    body("status").isIn(["Solved", "Failed", "Attempted"]).withMessage("status must be Solved/Failed/Attempted"),
    body("attempts").optional().isInt({ min: 1 }).withMessage("attempts must be >= 1"),
    body("timeTaken").optional().isFloat({ min: 0 }).withMessage("timeTaken must be >= 0"),
  ],
  handleValidation,
  addSubmission
);

router.get("/", requireAuth, listSubmissions);
router.get("/recent", requireAuth, recentActivity);

module.exports = router;
