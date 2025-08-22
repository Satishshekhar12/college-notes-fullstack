import express from "express";
import {
	signup,
	login,
	protect,
	forgotPassword,
	resetPassword,
	updatePassword,
	setInitialPassword,
	getMe,
	updateMe,
	updateUploadStats,
	getUserProfile,
	syncUserStats,
} from "../controllers/authController.js";
import {
	getAllUsers,
	getUser,
	getModerators,
	updateUserRole,
	updateUserStatus,
	getDashboardStats,
} from "../controllers/adminController.js";
import {
	requireAdmin,
	requireModeratorOrAbove,
	requireSeniorModeratorOrAbove,
} from "../middleware/authorize.js";
import {
	getSettings,
	updateSettings,
} from "../controllers/settingsController.js";

const router = express.Router();

// Public auth routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// Protected auth routes
router.patch("/updatePassword", protect, updatePassword);
router.patch("/setInitialPassword", protect, setInitialPassword);
router.get("/me", protect, getMe);
router.patch("/updateMe", protect, updateMe);
router.get("/profile", protect, getUserProfile);
router.patch("/updateUploadStats", protect, updateUploadStats);

// Dashboard stats (moderator or above)
router.get(
	"/dashboard-stats",
	protect,
	requireModeratorOrAbove,
	getDashboardStats
);

// Admin-only user management
router.get("/users", protect, requireAdmin, getAllUsers);
router.get("/users/:id", protect, requireAdmin, getUser);

// Moderator management
router.get("/moderators", protect, requireModeratorOrAbove, getModerators);
router.patch(
	"/users/:id/role",
	protect,
	requireSeniorModeratorOrAbove,
	updateUserRole
);
router.patch(
	"/users/:id/status",
	protect,
	requireSeniorModeratorOrAbove,
	updateUserStatus
);

// Sync user upload statistics (admin route)
router.post("/sync-user-stats", protect, requireAdmin, syncUserStats);

// Settings (admin only)
router.get("/settings", protect, requireAdmin, getSettings);
router.patch("/settings", protect, requireAdmin, updateSettings);

// Welcome route
router.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Welcome to the College Notes API!",
	});
});

export default router;
