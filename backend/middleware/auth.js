import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      // Check if user is banned
      if (req.user && req.user.isBanned) {
        return res.status(403).json({ 
          message: "Your account has been banned. Please contact support.",
          banned: true 
        });
      }

      return next();
    } catch (err) {
      console.error("Token verification failed: ", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  return res.status(401).json({ message: "Not authorized, token failed" });
};

export const admin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Allow both main admin and co-admin
  if (!req.user.isAdmin && !req.user.isCoAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }

  next();
};

// Middleware to check if user is the main admin (admin@admin.com)
// Only main admin can promote/unpromote users
export const mainAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Only admin@admin.com can perform this action
  if (req.user.email !== "admin@admin.com" || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Main admin privileges required." });
  }

  next();
};