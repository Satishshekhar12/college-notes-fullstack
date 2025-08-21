import express from "express";
import { protect } from "../controllers/authController.js";
import {
	getMyNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;
