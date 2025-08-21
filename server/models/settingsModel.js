import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
	{
		siteName: { type: String, default: "College Notes" },
		siteDescription: {
			type: String,
			default: "A platform for sharing educational resources",
		},
		maxUploadSize: { type: Number, default: 50 }, // in MB
		allowedFileTypes: {
			type: [String],
			default: ["pdf", "doc", "docx", "ppt", "pptx", "txt", "jpg", "png"], // extensions
		},
		autoApproval: { type: Boolean, default: false },
		emailNotifications: { type: Boolean, default: true },
		maintenanceMode: { type: Boolean, default: false },
		registrationOpen: { type: Boolean, default: true },
		moderatorAutoApproval: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
