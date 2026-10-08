/**
 * middleware/auth.js
 * ------------------
 * Verifies the JWT sent in the Authorization header ("Bearer <token>") and
 * attaches the decoded { id } payload to req.user. Used to protect every
 * route except /api/auth/register and /api/auth/login.
 */

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = requireAuth;
