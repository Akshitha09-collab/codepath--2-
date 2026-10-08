/**
 * server.js
 * ---------
 * CodePath backend entry point. Wires together:
 *   MongoDB connection -> Express middleware -> Routes -> Error handler
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const codeforcesRoutes = require("./routes/codeforcesRoutes");
const { getDashboard } = require("./controllers/dashboardController");
const requireAuth = require("./middleware/auth");
const mlClient = require("./utils/mlClient");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/codeforces", codeforcesRoutes);
app.get("/api/dashboard", requireAuth, getDashboard);

// Health check that also verifies the ML service is reachable
app.get("/api/health", async (req, res) => {
  let mlStatus = "unreachable";
  try {
    await mlClient.checkHealth();
    mlStatus = "ok";
  } catch (err) {
    mlStatus = "unreachable";
  }
  res.json({ status: "ok", service: "codepath-backend", mlService: mlStatus });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`CodePath backend running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
