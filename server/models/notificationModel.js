import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		title: { type: String, trim: true },
		message: { type: String, required: true, trim: true },
		type: { type: String, trim: true }, // e.g., moderator_approved, moderator_rejected, note_approved, note_rejected, delete_request_executed, delete_request_rejected
		isRead: { type: Boolean, default: false },
		readAt: { type: Date },
		link: { type: String, trim: true }, // optional client route to navigate
		metadata: { type: mongoose.Schema.Types.Mixed },
	},
	{ timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
