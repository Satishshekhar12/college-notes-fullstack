import ModeratorRequest from "../models/moderatorRequestModel.js";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import Settings from "../models/settingsModel.js";
import { createNotification } from "./notificationController.js";

// Submit a new moderator request
export const submitModeratorRequest = catchAsync(async (req, res, next) => {
	const {
		reason,
		experience,
		additionalInfo,
		college,
		course,
		semester,
		previousContributions,
		linkedinProfile,
		githubProfile,
	} = req.body;

	// Check settings for auto-approval
	const settings = (await Settings.findOne()) || {};
	const autoApprove = !!settings.moderatorAutoApproval;

	// Check if user already has a pending request
	const existingRequest = await ModeratorRequest.findOne({
		applicant: req.user.id,
		status: "pending",
	});

	if (existingRequest) {
		return res.status(400).json({
			success: false,
			message:
				"You already have a pending moderator request. Please wait for admin review.",
		});
	}

	// Check if user is already a moderator or above
	if (["moderator", "senior moderator", "admin"].includes(req.user.role)) {
		return res.status(400).json({
			success: false,
			message: "You already have moderator privileges or higher.",
		});
	}

	// Create new request
	const moderatorRequest = await ModeratorRequest.create({
		applicant: req.user.id,
		reason: reason.trim(),
		experience: experience.trim(),
		additionalInfo: additionalInfo?.trim(),
		college: college.trim(),
		course: course.trim(),
		semester: semester?.trim(),
		previousContributions: previousContributions?.trim(),
		linkedinProfile: linkedinProfile?.trim(),
		githubProfile: githubProfile?.trim(),
		ipAddress: req.ip,
	});

	// If auto-approval enabled, approve immediately
	if (autoApprove) {
		await User.findByIdAndUpdate(req.user.id, { role: "moderator" });
		moderatorRequest.status = "approved";
		moderatorRequest.reviewedBy = req.user.id;
		moderatorRequest.reviewedAt = new Date();
		await moderatorRequest.save();

		// Notify applicant
		await createNotification({
			user: req.user.id,
			type: "moderator_approved",
			title: "Moderator Approved",
			message: "Your moderator request has been auto-approved.",
			link: "/profile",
			metadata: { requestId: moderatorRequest._id },
		});

		return res.status(201).json({
			success: true,
			message: "Moderator request auto-approved.",
			data: { request: moderatorRequest },
		});
	}

	res.status(201).json({
		success: true,
		message:
			"Moderator request submitted successfully. You will be notified once admin reviews your application.",
		data: {
			request: moderatorRequest,
		},
	});
});

// Get user's own moderator request status
export const getMyModeratorRequest = catchAsync(async (req, res, next) => {
	const request = await ModeratorRequest.findOne({
		applicant: req.user.id,
	})
		.populate("reviewedBy", "name email")
		.sort({ createdAt: -1 });

	res.json({
		success: true,
		data: {
			request,
			hasRequest: !!request,
			canApply: !request || request.status !== "pending",
		},
	});
});

// Get all moderator requests (Admin only)
export const getAllModeratorRequests = catchAsync(async (req, res, next) => {
	const {
		status = "all",
		page = 1,
		limit = 20,
		sortBy = "createdAt",
		sortOrder = "desc",
	} = req.query;

	// Build query
	const query = {};
	if (status && status !== "all") {
		query.status = status;
	}

	// Build sort object
	const sort = {};
	sort[sortBy] = sortOrder === "desc" ? -1 : 1;

	// Execute query with pagination
	const skip = (page - 1) * limit;

	const requests = await ModeratorRequest.find(query)
		.populate(
			"applicant",
			"name email createdAt totalUploads approvedUploads rejectedUploads"
		)
		.populate("reviewedBy", "name email")
		.sort(sort)
		.skip(skip)
		.limit(parseInt(limit));

	const total = await ModeratorRequest.countDocuments(query);

	// Get statistics
	const stats = await ModeratorRequest.aggregate([
		{
			$group: {
				_id: "$status",
				count: { $sum: 1 },
			},
		},
	]);

	const statsObject = stats.reduce((acc, stat) => {
		acc[stat._id] = stat.count;
		return acc;
	}, {});

	res.json({
		success: true,
		data: {
			requests,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalRequests: total,
				hasNextPage: page * limit < total,
				hasPrevPage: page > 1,
			},
			stats: {
				pending: statsObject.pending || 0,
				approved: statsObject.approved || 0,
				rejected: statsObject.rejected || 0,
				total,
			},
		},
	});
});

// Approve moderator request (Admin only)
export const approveModeratorRequest = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { adminFeedback } = req.body;

	const request = await ModeratorRequest.findById(id);

	if (!request) {
		return res.status(404).json({
			success: false,
			message: "Moderator request not found",
		});
	}

	if (request.status !== "pending") {
		return res.status(400).json({
			success: false,
			message: "This request has already been processed",
		});
	}

	// Update the user role to moderator
	await User.findByIdAndUpdate(request.applicant._id, {
		role: "moderator",
	});

	// Update the request
	request.status = "approved";
	request.reviewedBy = req.user.id;
	request.reviewedAt = new Date();
	request.adminFeedback = adminFeedback?.trim();
	await request.save();

	// Notify applicant
	await createNotification({
		user: request.applicant._id,
		type: "moderator_approved",
		title: "Moderator Approved",
		message: "Your moderator request has been approved.",
		link: "/profile",
		metadata: { requestId: request._id },
	});

	res.json({
		success: true,
		message: `Successfully approved ${request.applicant.name} as a moderator`,
		data: {
			request,
		},
	});
});

// Reject moderator request (Admin only)
export const rejectModeratorRequest = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { adminFeedback } = req.body;

	if (!adminFeedback || !adminFeedback.trim()) {
		return res.status(400).json({
			success: false,
			message: "Admin feedback is required for rejection",
		});
	}

	const request = await ModeratorRequest.findById(id);

	if (!request) {
		return res.status(404).json({
			success: false,
			message: "Moderator request not found",
		});
	}

	if (request.status !== "pending") {
		return res.status(400).json({
			success: false,
			message: "This request has already been processed",
		});
	}

	// Update the request
	request.status = "rejected";
	request.reviewedBy = req.user.id;
	request.reviewedAt = new Date();
	request.adminFeedback = adminFeedback.trim();
	await request.save();

	// Notify applicant
	await createNotification({
		user: request.applicant._id,
		type: "moderator_rejected",
		title: "Moderator Request Rejected",
		message: `Your moderator request was rejected. Reason: ${adminFeedback.trim()}`,
		link: "/profile",
		metadata: { requestId: request._id },
	});

	res.json({
		success: true,
		message: `Request from ${request.applicant.name} has been rejected`,
		data: {
			request,
		},
	});
});

// Delete moderator request (Admin only)
export const deleteModeratorRequest = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const request = await ModeratorRequest.findById(id);

	if (!request) {
		return res.status(404).json({
			success: false,
			message: "Moderator request not found",
		});
	}

	await ModeratorRequest.findByIdAndDelete(id);

	res.json({
		success: true,
		message: "Moderator request deleted successfully",
	});
});

// Get moderator request by ID (Admin only)
export const getModeratorRequestById = catchAsync(async (req, res, next) => {
	const { id } = req.params;

	const request = await ModeratorRequest.findById(id)
		.populate(
			"applicant",
			"name email createdAt totalUploads approvedUploads rejectedUploads"
		)
		.populate("reviewedBy", "name email");

	if (!request) {
		return res.status(404).json({
			success: false,
			message: "Moderator request not found",
		});
	}

	res.json({
		success: true,
		data: {
			request,
		},
	});
});
