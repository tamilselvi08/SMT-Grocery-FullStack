import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verifies the JWT and attaches the user (without password) to req.user.
// Any route wrapped with this becomes a "protected" route.
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized. Please login." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session. Please login again." });
  }
}

// Only allows the request through if req.user.role === "admin".
// Must run after `protect`.
export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

// Populates req.user if a valid token is present, but never blocks the
// request. Used on routes that behave differently for guests vs logged-in
// users (e.g. merging a guest cart).
export async function attachUserIfPresent(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    // Silently ignore - this middleware never blocks the request.
  }
  next();
}
