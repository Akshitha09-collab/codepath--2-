/**
 * routes/performanceRoutes.js
 */

const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  getPerformance, recompute, getAnalysis, getProgress,
} = require("../controllers/performanceController");

const router = express.Router();

router.get("/", requireAuth, getPerformance);
router.post("/recompute", requireAuth, recompute);
router.get("/analysis", requireAuth, getAnalysis);
router.get("/progress", requireAuth, getProgress);

module.exports = router;
