/**
 * routes/problemRoutes.js
 */

const express = require("express");
const requireAuth = require("../middleware/auth");
const { listProblems, listTopics } = require("../controllers/problemController");

const router = express.Router();

router.get("/", requireAuth, listProblems);
router.get("/topics", requireAuth, listTopics);

module.exports = router;
