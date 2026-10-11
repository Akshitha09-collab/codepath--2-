
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

// Backend and ML service health check
app.get("/api/health", async (req, res) => {
  let mlStatus = "unreachable";

  try {
    const mlHealth = await mlClient.checkHealth();

    if (mlHealth && mlHealth.status === "ok") {
      mlStatus = "ok";
    }
  } catch (err) {
    console.error("ML health check failed:", err.message);
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
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error-handling middleware
app.use(errorHandler);

// Render assigns the port through process.env.PORT
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`CodePath backend listening on port ${PORT}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start CodePath backend:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;

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

// Backend and ML service health check
app.get("/api/health", async (req, res) => {
  let mlStatus = "unreachable";

  try {
    const mlHealth = await mlClient.checkHealth();

    if (mlHealth && mlHealth.status === "ok") {
      mlStatus = "ok";
    }
  } catch (err) {
    console.error("ML health check failed:", err.message);
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
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error-handling middleware
app.use(errorHandler);

// Render assigns the port through process.env.PORT
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`CodePath backend listening on port ${PORT}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start CodePath backend:", err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
