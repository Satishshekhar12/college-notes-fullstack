import Notification from "../models/notificationModel.js";
import catchAsync from "../utils/catchAsync.js";

// Helper for creating a notification from other controllers
export const createNotification = async ({
	user,
	title,
	message,
	type,
	link,
	metadata,
}) => {
	try {
		if (!user || !message) return null;
		const notif = await Notification.create({
			user,
			title,
			message,
			type,
			link,
			metadata,
		});
		return notif;
	} catch (err) {
		console.error("Failed to create notification:", err?.message);
		return null;
	}
};

// GET /api/notifications
export const getMyNotifications = catchAsync(async (req, res) => {
	const { page = 1, limit = 20, onlyUnread } = req.query;
	const filter = { user: req.user.id };
	if (String(onlyUnread) === "true") filter.isRead = false;

	const skip = (parseInt(page) - 1) * parseInt(limit);

	const [items, total, unread] = await Promise.all([
		Notification.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit)),
		Notification.countDocuments(filter),
		Notification.countDocuments({ user: req.user.id, isRead: false }),
	]);

	res.json({
		success: true,
		data: {
			items,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / parseInt(limit)),
				total,
			},
			unread,
		},
	});
});

// GET /api/notifications/unread-count
export const getUnreadCount = catchAsync(async (req, res) => {
	const unread = await Notification.countDocuments({
		user: req.user.id,
		isRead: false,
	});
	res.json({ success: true, data: { unread } });
});

// PATCH /api/notifications/:id/read
export const markAsRead = catchAsync(async (req, res) => {
	const { id } = req.params;
	const notif = await Notification.findOne({ _id: id, user: req.user.id });
	if (!notif) {
		return res
			.status(404)
			.json({ success: false, message: "Notification not found" });
	}
	if (!notif.isRead) {
		notif.isRead = true;
		notif.readAt = new Date();
		await notif.save();
	}
	res.json({ success: true, data: notif });
});

// PATCH /api/notifications/read-all
export const markAllAsRead = catchAsync(async (req, res) => {
	await Notification.updateMany(
		{ user: req.user.id, isRead: false },
		{ isRead: true, readAt: new Date() }
	);
	res.json({ success: true, message: "All notifications marked as read" });
});
