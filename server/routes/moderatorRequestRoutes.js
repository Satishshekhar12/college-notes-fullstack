import express from "express";
import {
	submitModeratorRequest,
	getMyModeratorRequest,
	getAllModeratorRequests,
	approveModeratorRequest,
	rejectModeratorRequest,
	deleteModeratorRequest,
	getModeratorRequestById,
} from "../controllers/moderatorRequestController.js";
import { protect } from "../controllers/authController.js";
import {
	requireAdmin,
	requireModeratorOrAbove,
	requireSeniorModeratorOrAbove,
} from "../middleware/authorize.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes (authenticated users)
router.post("/submit", submitModeratorRequest); // Submit moderator request
router.get("/my-request", getMyModeratorRequest); // Get own request status

// Moderation routes
router.get("/", requireModeratorOrAbove, getAllModeratorRequests); // List all requests (view-only for moderators)
router.get("/:id", requireModeratorOrAbove, getModeratorRequestById); // Get request by ID
router.patch(
	"/:id/approve",
	requireSeniorModeratorOrAbove,
	approveModeratorRequest
); // Approve (senior/admin)
router.patch(
	"/:id/reject",
	requireSeniorModeratorOrAbove,
	rejectModeratorRequest
); // Reject (senior/admin)
router.delete("/:id", requireSeniorModeratorOrAbove, deleteModeratorRequest); // Delete request (senior/admin)

export default router;
