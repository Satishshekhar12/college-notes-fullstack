import mongoose from "mongoose";

const driveShareSchema = new mongoose.Schema(
	{
		fileId: { type: String, required: true, index: true },
		fileName: { type: String, required: true },
		mimeType: { type: String, default: "" },
		size: { type: Number, default: 0 },
		webViewLink: { type: String, default: "" },
		ownerUser: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		ownerUsername: { type: String, default: "" },
		recipientUser: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		// Optional: share to a group (fan-out stored separately per member; kept for auditing)
		groupId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "FriendGroup",
			index: true,
			default: null,
		},
		recipientUsername: { type: String, default: "" },
		role: {
			type: String,
			enum: ["reader", "commenter", "writer"],
			default: "reader",
		},
		sharedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

driveShareSchema.index(
	{ ownerUser: 1, recipientUser: 1, fileId: 1 },
	{ unique: true }
);

const DriveShare = mongoose.model("DriveShare", driveShareSchema);

export default DriveShare;
