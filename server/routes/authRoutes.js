import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import "../config/passport.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// Kick off Google OAuth
router.get(
  "/auth/google",
  (req, res, next) => {
    console.log("🔍 Google OAuth initiated from:", req.get('origin') || req.get('referer') || 'unknown');
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// OAuth callback -> issue JWT cookie -> redirect
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/login-failed" }),
  async (req, res) => {
    console.log("🎯 Google OAuth callback received");
    console.log("👤 User profile:", req.user);
    try {
      const { googleId, email, name } = req.user;

      // Find existing user by googleId or email; if none, create minimal user
      let user = await User.findOne({ $or: [{ googleId }, { email }] });

      if (!user) {
        // For Google-created accounts, use placeholders for required fields
        const placeholderPwd = jwt
          .sign({ sub: googleId }, process.env.JWT_SECRET)
          .slice(0, 12) + "A1#";
        user = await User.create({
          name: name || "Google User",
          email: email || `${googleId}@placeholder.local`,
          password: placeholderPwd,
          passwordConfirm: placeholderPwd,
          collegeName: "Not Provided",
          course: "Not Provided",
          semester: 1,
          studentType: "UG",
          googleId,
        });
      } else if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const isProd = process.env.NODE_ENV === "production";
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });

      const clientUrl = process.env.CLIENT_URL || "https://clg-notes.netlify.app";
      return res.redirect(`${clientUrl}/login?from=google`);
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      return res.redirect("/api/login-failed");
    }
  }
);

// Exchange httpOnly cookie for a bearer token the SPA can store
router.get("/auth/token", protect, async (req, res) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.status(401).json({ status: "fail", message: "No session" });
    res.json({ status: "success", token, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  } catch (e) {
    res.status(500).json({ status: "error", message: "Exchange failed" });
  }
});

// Admin Google OAuth routes
router.get(
  "/auth/google/admin",
  (req, res, next) => {
    console.log("🔍 Admin Google OAuth initiated from:", req.get('origin') || req.get('referer') || 'unknown');
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Admin OAuth callback -> check role -> issue JWT cookie -> redirect
router.get(
  "/auth/google/admin/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/admin-login-failed" }),
  async (req, res) => {
    console.log("🎯 Admin Google OAuth callback received");
    console.log("👤 User profile:", req.user);
    try {
      const { googleId, email, name } = req.user;

      // Find existing user by googleId or email
      let user = await User.findOne({ $or: [{ googleId }, { email }] });

      if (!user) {
        // For admin Google login, don't auto-create users - they must exist
        console.log("❌ Admin Google login: User not found in database");
        return res.redirect("/api/admin-login-failed");
      }

      // Check if user has admin/moderator privileges
      if (!["admin", "moderator", "senior moderator"].includes(user.role)) {
        console.log("❌ Admin Google login: User lacks admin privileges, role:", user.role);
        return res.redirect("/api/admin-login-failed");
      }

      // Update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      const isProd = process.env.NODE_ENV === "production";
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });

      const clientUrl = process.env.CLIENT_URL || "https://clg-notes.netlify.app";
      return res.redirect(`${clientUrl}/admin?from=google`);
    } catch (err) {
      console.error("Admin Google OAuth callback error:", err);
      return res.redirect("/api/admin-login-failed");
    }
  }
);

// Admin login failure route
router.get("/admin-login-failed", (_req, res) => {
  res.status(401).json({ success: false, message: "Admin Google login failed - insufficient privileges or user not found" });
});

// Optional failure route
router.get("/login-failed", (_req, res) => {
  res.status(401).json({ success: false, message: "Google login failed" });
});

export default router;
