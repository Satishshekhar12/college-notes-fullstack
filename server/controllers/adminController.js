import e from "express";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import Note from "../models/noteModel.js";
import ModeratorRequest from "../models/moderatorRequestModel.js";

const signToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

// Role levels for enforcing hierarchy
const ROLE_LEVEL = {
	user: 0,
	moderator: 1,
	"senior moderator": 2,
	admin: 3,
};

export const getAllUsers = catchAsync(async (req, res, next) => {
	const users = await User.find().select("-password -passwordConfirm");
	res.status(200).json({
		status: "success",
		results: users.length,
		data: {
			users,
		},
	});
});

export const getUser = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.params.id).select(
		"-password -passwordConfirm"
	);
	if (!user) {
		return next({
			statusCode: 404,
			message: "No user found with that ID",
		});
	}
	res.status(200).json({
		status: "success",
		data: {
			user,
		},
	});
});

// List moderators and above
export const getModerators = catchAsync(async (req, res) => {
	const roles = ["moderator", "senior moderator", "admin"];
	const users = await User.find({ role: { $in: roles } }).select(
		"name email role isActive createdAt totalUploads approvedUploads rejectedUploads"
	);
	res.status(200).json({
		status: "success",
		results: users.length,
		data: { users },
	});
});

// Update a user's role (admin only)
export const updateUserRole = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { role } = req.body;
	const allowed = ["user", "moderator", "senior moderator", "admin"];
	if (!allowed.includes(role)) {
		return next({ statusCode: 400, message: "Invalid role" });
	}

	// Get acting user's level
	const actingLevel = ROLE_LEVEL[req.user.role] ?? 0;

	// Find target user first to validate hierarchy
	const targetUser = await User.findById(id).select("role name");
	if (!targetUser) return next({ statusCode: 404, message: "User not found" });

	const targetLevel = ROLE_LEVEL[targetUser.role] ?? 0;
	const newRoleLevel = ROLE_LEVEL[role] ?? -1;

	// Only higher-level can modify lower-level users
	if (targetLevel >= actingLevel) {
		return next({
			statusCode: 403,
			message: "You cannot modify users with equal or higher role.",
		});
	}

	// Cannot assign a role higher than your own level
	if (newRoleLevel > actingLevel) {
		return next({
			statusCode: 403,
			message: "You cannot assign a role higher than your own.",
		});
	}

	const user = await User.findByIdAndUpdate(
		id,
		{ role },
		{ new: true, runValidators: true }
	).select("-password -passwordConfirm");

	res.status(200).json({ status: "success", data: { user } });
});

// Update a user's active status (admin only)
export const updateUserStatus = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { isActive } = req.body;
	if (typeof isActive !== "boolean") {
		return next({ statusCode: 400, message: "isActive must be boolean" });
	}

	// Hierarchy check: cannot change status of equal/higher role
	const actingLevel = ROLE_LEVEL[req.user.role] ?? 0;
	const targetUser = await User.findById(id).select("role");
	if (!targetUser) return next({ statusCode: 404, message: "User not found" });
	const targetLevel = ROLE_LEVEL[targetUser.role] ?? 0;
	if (targetLevel >= actingLevel) {
		return next({
			statusCode: 403,
			message: "You cannot modify users with equal or higher role.",
		});
	}

	const user = await User.findByIdAndUpdate(
		id,
		{ isActive },
		{ new: true, runValidators: true }
	).select("-password -passwordConfirm");
	if (!user) return next({ statusCode: 404, message: "User not found" });
	res.status(200).json({ status: "success", data: { user } });
});

// Dashboard combined stats (moderator or above)
export const getDashboardStats = catchAsync(async (req, res) => {
	const [totalUsers, activeModerators, pendingUploads, pendingRequests] =
		await Promise.all([
			User.countDocuments({}),
			User.countDocuments({
				role: { $in: ["moderator", "senior moderator", "admin"] },
				isActive: true,
			}),
			Note.countDocuments({ status: "pending" }),
			ModeratorRequest.countDocuments({ status: "pending" }),
		]);

	res.status(200).json({
		status: "success",
		data: {
			totalUsers,
			activeModerators,
			pendingUploads,
			pendingModeratorRequests: pendingRequests,
		},
	});
});
