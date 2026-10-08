/**
 * routes/codeforcesRoutes.js
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const requireAuth = require("../middleware/auth");
const { syncCodeforces, getCodeforcesStatus } = require("../controllers/codeforcesController");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

router.post(
  "/sync",
  requireAuth,
  [body("handle").trim().notEmpty().withMessage("handle is required")],
  handleValidation,
  syncCodeforces
);

router.get("/status", requireAuth, getCodeforcesStatus);

module.exports = router;
