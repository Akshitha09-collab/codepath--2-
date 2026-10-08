/**
 * middleware/errorHandler.js
 * --------------------------
 * Centralized error handler so controllers can just `next(err)` and get a
 * consistent JSON error shape instead of leaking stack traces to the client.
 */

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation error", details: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate value", details: err.keyValue });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
}

module.exports = errorHandler;
