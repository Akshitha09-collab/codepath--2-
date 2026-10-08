/**
 * routes/recommendationRoutes.js
 */

const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  getRecommendations, getDailyPractice, getRecommendationHistory,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/", requireAuth, getRecommendations);
router.get("/daily", requireAuth, getDailyPractice);
router.get("/history", requireAuth, getRecommendationHistory);

module.exports = router;
