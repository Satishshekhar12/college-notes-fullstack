import Settings from "../models/settingsModel.js";
import catchAsync from "../utils/catchAsync.js";
import { applySettingsToS3Config } from "../config/aws.js";

// Ensure a single settings document exists and return it
const getOrCreateSettings = async () => {
	let doc = await Settings.findOne();
	if (!doc) {
		doc = await Settings.create({});
	}
	return doc;
};

export const getSettings = catchAsync(async (req, res) => {
	const settings = await getOrCreateSettings();
	res.status(200).json({ status: "success", data: { settings } });
});

export const updateSettings = catchAsync(async (req, res, next) => {
	const updates = req.body || {};

	// Normalize and validate inputs
	if (typeof updates.maxUploadSize !== "undefined") {
		const val = Number(updates.maxUploadSize);
		if (Number.isNaN(val) || val < 1 || val > 100) {
			return next({
				statusCode: 400,
				message: "maxUploadSize must be between 1 and 100 MB",
			});
		}
		updates.maxUploadSize = val;
	}

	if (Array.isArray(updates.allowedFileTypes)) {
		updates.allowedFileTypes = updates.allowedFileTypes
			.map((x) => String(x).toLowerCase().replace(/^\./, ""))
			.filter(Boolean);
	}

	const doc = await getOrCreateSettings();
	Object.assign(doc, updates);
	await doc.save();

	// Apply to runtime config immediately
	applySettingsToS3Config(doc.toObject());

	res.status(200).json({ status: "success", data: { settings: doc } });
});
