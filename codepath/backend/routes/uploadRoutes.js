/**
 * routes/uploadRoutes.js
 * Multer stores the CSV in memory (not disk) since we only need to parse
 * it once; keeps the server filesystem clean for a student project.
 */

const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const { uploadCsv } = require("../controllers/uploadController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max, generous for a CSV of practice history
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      return cb(new Error("Only .csv files are allowed."));
    }
    cb(null, true);
  },
});

router.post("/csv", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadCsv);

module.exports = router;
