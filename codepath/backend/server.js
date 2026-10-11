/**
 * server.js
 * ---------
 * CodePath backend entry point. Wires together:
 * MongoDB connection -> Express middleware -> Routes -> Error handler
 */

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/codeforces", codeforcesRoutes);

app.get("/api/dashboard", requireAuth, getDashboard);

// Health check: verifies whether the ML service is reachable
app.get("/api/health", async (req, res) => {
  let mlStatus = "unreachable";

  try {
    const result = await mlClient.checkHealth();

    console.log("ML health check successful:", result);
    mlStatus = "ok";
  } catch (err) {
    // Log the actual error to help troubleshoot the connection
    console.error("ML health check failed:", err.message);

    if (err.response) {
      console.error("ML service HTTP status:", err.response.status);
      console.error("ML service response:", err.response.data);
    } else if (err.code) {
      console.error("ML connection error code:", err.code);
    }

    mlStatus = "unreachable";
  }

  res.json({
    status: "ok",
    service: "codepath-backend",
    mlService: mlStatus,
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: Route not found: ${req.method} ${req.originalUrl},
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(CodePath backend running on port ${PORT});
    });
  } catch (err) {
    console.error("Failed to start CodePath backend:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;