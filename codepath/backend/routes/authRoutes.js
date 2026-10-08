/**
 * routes/authRoutes.js
 */

const express = require("express");
const { body, validationResult } = require("express-validator");
const requireAuth = require("../middleware/auth");
const { register, login, me, logout } = require("../controllers/authController");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  handleValidation,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  handleValidation,
  login
);

router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

module.exports = router;
