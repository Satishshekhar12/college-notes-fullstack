import express from "express";
import {
	uploadNote,
	getAllNotes,
	getNoteById,
	downloadNote,
	approveNote,
	rejectNote,
	getUserNotes,
	deleteNote,
	getModerationStats,
	uploadMiddleware,
} from "../controllers/noteController.js";
import { protect } from "../controllers/authController.js";
import {
	requireModeratorOrAbove,
	requireSeniorModeratorOrAbove,
} from "../middleware/authorize.js";
import {
	createDeleteRequest,
	listDeleteRequests,
	approveDeleteRequest,
	rejectDeleteRequest,
} from "../controllers/deleteRequestController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", getAllNotes); // Get approved notes for public viewing

// Protected routes (authentication required)
router.use(protect); // All routes below require authentication

// Test route for debugging
router.get("/test-auth", (req, res) => {
	res.json({
		success: true,
		message: "Authentication working",
		user: {
			id: req.user._id,
			name: req.user.name,
			email: req.user.email,
			role: req.user.role,
		},
	});
});

// Admin/Moderator routes (must come before generic :id routes)
router.get("/admin/stats", requireModeratorOrAbove, getModerationStats); // Get moderation statistics
router.get("/admin/all", requireModeratorOrAbove, getAllNotes); // Get all notes for admin (with filtering)

// Delete request workflow
router.post("/delete-requests", requireModeratorOrAbove, createDeleteRequest); // create a request
router.get("/delete-requests", requireModeratorOrAbove, listDeleteRequests); // list requests
router.post(
	"/delete-requests/:id/approve",
	requireSeniorModeratorOrAbove,
	approveDeleteRequest
); // approve & execute
router.post(
	"/delete-requests/:id/reject",
	requireSeniorModeratorOrAbove,
	rejectDeleteRequest
); // reject

// User routes (authenticated users)
router.post("/upload", uploadMiddleware, uploadNote); // Upload new note
router.get("/user/my-notes", getUserNotes); // Get user's own notes

// Note-specific routes (these must come after admin routes to avoid conflicts)
router.get("/:id", getNoteById); // Get single note (public can only see approved)
router.get("/:id/download", downloadNote); // Download note file
router.delete("/:id", deleteNote); // Delete own note (admin/senior moderator may also delete via request approval)

// Moderator+ routes (moderation privileges required)
router.patch("/:id/approve", requireModeratorOrAbove, approveNote); // Approve note
router.patch("/:id/reject", requireModeratorOrAbove, rejectNote); // Reject note

export default router;
