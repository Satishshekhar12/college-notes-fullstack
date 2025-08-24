import { promisify } from "util";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import { errorHandler } from "../middleware/errorHandler.js";
import sendEmail from "../utils/email.js";
import crypto from "crypto";
import Settings from "../models/settingsModel.js";
import { createNotification } from "./notificationController.js";
import { sendPasswordResetEmail } from "../utils/gmailService.js";

const signToken = (id, am = "password") => {
	return jwt.sign({ id, am }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
};

// Helper: collect client info for notifications
const getClientInfo = (req) => {
	const forwarded = req.headers["x-forwarded-for"]; // may be comma-separated
	const ip = Array.isArray(forwarded)
		? forwarded[0]
		: (forwarded || "").split(",")[0].trim() || req.ip || "unknown";
	const userAgent = req.headers["user-agent"] || "unknown";
	return { ip, userAgent };
};

// Helper: fire a password-related notification
const notifyPasswordChange = async (req, userId, { kind, method }) => {
	try {
		const when = new Date();
		const whenIso = when.toISOString();
		const { ip, userAgent } = getClientInfo(req);
		const title =
			kind === "initial_set"
				? "Password set"
				: kind === "reset"
				? "Password reset"
				: "Password changed";
		const message = `${title} on ${when.toUTCString()} from ${ip}. If this wasn't you, please secure your account.`;
		await createNotification({
			user: userId,
			title,
			message,
			type: "security_password_change",
			link: "/profile",
			metadata: {
				when: whenIso,
				ip,
				userAgent,
				method, // password | google | email_reset | google_reauth | initial_set
				kind, // changed | reset | initial_set
			},
		});
	} catch (e) {
		// Non-fatal
		console.warn("Password change notification failed:", e?.message);
	}
};

// Implement signup logic here
export const signup = catchAsync(async (req, res, next) => {
	// Check registration setting
	const settings = (await Settings.findOne()) || {};
	if (settings.registrationOpen === false) {
		return next({
			statusCode: 403,
			message: "Registration is currently closed.",
		});
	}

	const newUser = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password,
		passwordConfirm: req.body.passwordConfirm,
		role: req.body.role,
		collegeName: req.body.collegeName,
		course: req.body.course,
		semester: req.body.semester,
		studentType: req.body.studentType,
	});

	const token = signToken(newUser._id, "password");
	res.status(201).json({
		status: "success",
		token,
		data: {
			user: newUser,
		},
	});
});

export const login = catchAsync(async (req, res, next) => {
	// Implement login logic here
	const identifier = req.body.identifier || req.body.email || req.body.username;
	const { password } = req.body;
	// Validate user credentials, generate JWT token, and send response
	//1- check email and password exist
	if (!identifier || !password) {
		next({
			statusCode: 400,
			message: "Please provide email/username and password",
		});
	}
	//2- check if user exists && password is correct
	const query = {
		$or: [
			{ email: identifier },
			{ username: String(identifier).toLowerCase() },
		],
	};
	const user = await User.findOne(query).select("+password");
	if (!user || !(await user.correctPassword(password, user.password))) {
		return next({
			statusCode: 401,
			message: "Incorrect email or password",
		});
	}

	//3- if everything is ok, send token to client
	const token = signToken(user._id, "password");
	//4- send response with user info
	res.status(200).json({
		status: "success",
		token,
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
	});
});

//task  from here ,do from lecture TOur model 1 in jwt
export const protect = catchAsync(async (req, res, next) => {
	//1- get token and check if it exists
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		token = req.headers.authorization.split(" ")[1];
	} else if (req.cookies.jwt) {
		//can remove this if not using cookies
		token = req.cookies.jwt;
	}

	if (!token) {
		console.error("No token provided");
		return res.status(401).json({
			success: false,
			message: "You are not logged in! Please log in to get access.",
		});
	}

	try {
		//2- verify token
		const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

		//3- check if user still exists
		const currentUser = await User.findById(decoded.id);
		if (!currentUser) {
			console.error("User not found for token:", decoded.id);
			return res.status(401).json({
				success: false,
				message: "The user belonging to this token does no longer exist.",
			});
		}

		// Attach auth method from token
		req.authMethod = decoded.am || decoded.authMethod || "password";

		// Check if user changed password after token was issued
		if (currentUser.changedPasswordAfter(decoded.iat)) {
			console.error(
				"User changed password after token was issued:",
				decoded.iat
			);
			return res.status(401).json({
				success: false,
				message: "User recently changed password! Please log in again.",
			});
		}

		//4- grant access to protected route
		req.user = currentUser;
		next();
	} catch (err) {
		console.error("Token verification failed:", err);
		if (err.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "Your token has expired! Please log in again.",
			});
		}
		return res.status(401).json({
			success: false,
			message: "Invalid token! Please log in again.",
		});
	}
});

export const restrictTo = (...roles) => {
	return (req, res, next) => {
		//roles- ['user','admin','moderator','senior moderator']
		if (!req.user || !roles.includes(req.user.role)) {
			return next({
				statusCode: 403,
				message: "You do not have permission to perform this action.",
			});
		}
		next();
	};
};

// Optional auth: attach req.user when a valid token is present; otherwise continue without error
export const optionalProtect = async (req, res, next) => {
	try {
		let token;
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		} else if (req.cookies && req.cookies.jwt) {
			token = req.cookies.jwt;
		}

		if (!token) return next();

		// Verify token but do not error out; on any failure, proceed as guest
		let decoded;
		try {
			decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
		} catch (e) {
			return next();
		}

		const currentUser = await User.findById(decoded.id);
		if (!currentUser) return next();

		if (currentUser.changedPasswordAfter(decoded.iat)) return next();

		req.user = currentUser;
		req.authMethod = decoded.am || decoded.authMethod || "password";
		return next();
	} catch (e) {
		// On any unexpected failure, continue without user
		return next();
	}
};

export const forgotPassword = catchAsync(async (req, res, next) => {
	//1- Get user based on posted email
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next({
			statusCode: 404,
			message: "There is no user with this email address.",
		});
	}

	// If email notifications disabled, short-circuit
	const settings = (await Settings.findOne()) || {};
	if (settings.emailNotifications === false) {
		return res.status(200).json({
			status: "success",
			message:
				"Email notifications are disabled by admin. Password reset not sent.",
		});
	}

	//2- Generate random reset token
	const resetToken = user.createPasswordResetToken(); //check this
	await user.save({ validateBeforeSave: false });

	//3- Send response to client
	const resetURL = `${
		process.env.CLIENT_URL || "http://localhost:5173"
	}/reset-password/${resetToken}`;

	const message = `Forgot your password? Click the link below to reset your password:\n\n${resetURL}\n\nIf you didn't forget your password, please ignore this email!\n\nThis link will expire in 30 minutes.`;
	try {
		await sendEmail({
			email: user.email,
			subject: "Your password reset token (valid for 30 minutes)",
			message,
		});
		res.status(200).json({
			status: "success",
			message: "Token sent to email!",
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });
		return next({
			statusCode: 500,
			message: "There was an error sending the email. Try again later!",
		});
	}
});

export const resetPassword = catchAsync(async (req, res, next) => {
	//1- Get user based on the token
	const hashedToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex");

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() }, // Check if token is not expired
	});

	//2- If token has not expired, set the new password
	if (!user) {
		return next({
			statusCode: 400,
			message: "Token is invalid or has expired.",
		});
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined; // Clear the reset token
	user.passwordResetExpires = undefined; // Clear the reset expiration

	await user.save(); // This will trigger the pre-save middleware to hash password and update passwordChangedAt

	// Notify
	await notifyPasswordChange(req, user._id, {
		kind: "reset",
		method: "email_reset",
	});

	//3- Update changedPasswordAt property for the user (handled automatically by pre-save middleware)

	//4- Log the user in, send JWT
	const token = signToken(user._id, "password");

	res.status(200).json({
		status: "success",
		token,
		message: "Password reset successful!",
	});
});

export const updatePassword = catchAsync(async (req, res, next) => {
	//1- Get user from collection
	const user = await User.findById(req.user.id).select("+password googleId");

	const { passwordCurrent, password, passwordConfirm } = req.body || {};
	if (!password || !passwordConfirm) {
		return next({
			statusCode: 400,
			message: "Password and passwordConfirm are required",
		});
	}

	//2- Rules based on account and session method
	const isGoogleLinked = !!user.googleId;
	const isGoogleSession = req.authMethod === "google";

	if (isGoogleLinked) {
		// If account is Google-linked, only allow change when logged in via Google
		if (!isGoogleSession) {
			return next({
				statusCode: 403,
				message: "Please login with Google to change your password.",
			});
		}
		// When verified via Google, do not require current password
	} else {
		if (!passwordCurrent) {
			return next({
				statusCode: 400,
				message: "Please provide your current password",
			});
		}
		const ok = await user.correctPassword(passwordCurrent, user.password);
		if (!ok) {
			return next({
				statusCode: 401,
				message: "Your current password is wrong.",
			});
		}
	}

	//3- Update password (no current password required if Google-linked)
	user.password = password;
	user.passwordConfirm = passwordConfirm;
	user.isPasswordSet = true; // ensure flag is set once they create a real password
	await user.save(); // triggers hashing and passwordChangedAt

	// Notify
	await notifyPasswordChange(req, user._id, {
		kind: "changed",
		method: isGoogleLinked ? "google" : "password",
	});

	//4- Log user in, send JWT
	const token = signToken(user._id, isGoogleLinked ? "google" : "password");
	res.status(200).json({ status: "success", token });
});

// Reset password with a short-lived Google reauth token (no current password)
export const resetPasswordWithGoogle = catchAsync(async (req, res, next) => {
	const { reauthToken, password, passwordConfirm } = req.body || {};
	if (!reauthToken)
		return next({ statusCode: 400, message: "Missing reauth token" });
	if (!password || !passwordConfirm)
		return next({
			statusCode: 400,
			message: "Password and confirmation required",
		});
	let payload;
	try {
		payload = jwt.verify(reauthToken, process.env.JWT_SECRET);
	} catch (e) {
		return next({
			statusCode: 401,
			message: "Invalid or expired verification token",
		});
	}
	if (payload.purpose !== "googleReauth" || !payload.id) {
		return next({ statusCode: 400, message: "Invalid verification token" });
	}
	const user = await User.findById(payload.id).select(
		"+password isPasswordSet"
	);
	if (!user) return next({ statusCode: 404, message: "User not found" });
	// Set new password without current password check
	user.password = password;
	user.passwordConfirm = passwordConfirm;
	user.isPasswordSet = true;
	await user.save();
	await notifyPasswordChange(req, user._id, {
		kind: "reset",
		method: "google_reauth",
	});
	const token = signToken(user._id);
	res.status(200).json({ status: "success", token });
});

// Set initial password for OAuth-created users who haven't set one yet
export const setInitialPassword = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id).select(
		"+password isPasswordSet"
	);
	if (!user) {
		return next({ statusCode: 404, message: "User not found" });
	}
	if (user.isPasswordSet) {
		return next({
			statusCode: 400,
			message: "Password already set. Use updatePassword instead.",
		});
	}
	const { password, passwordConfirm } = req.body || {};
	if (!password || !passwordConfirm) {
		return next({
			statusCode: 400,
			message: "Password and passwordConfirm are required",
		});
	}
	user.password = password;
	user.passwordConfirm = passwordConfirm;
	user.isPasswordSet = true;
	await user.save();

	// Notify
	await notifyPasswordChange(req, user._id, {
		kind: "initial_set",
		method: req.authMethod || "initial_set",
	});

	const token = signToken(user._id);
	res.status(200).json({ status: "success", token });
});

// Get current user profile
export const getMe = catchAsync(async (req, res, next) => {
	// req.user is available from protect middleware
	const user = await User.findById(req.user.id);

	res.status(200).json({
		status: "success",
		data: {
			user,
		},
	});
});

// Update current user profile (not password)
export const updateMe = catchAsync(async (req, res, next) => {
	// 1- Create error if user POSTs password data
	if (req.body.password || req.body.passwordConfirm) {
		return next({
			statusCode: 400,
			message:
				"This route is not for password updates. Please use /updatePassword.",
		});
	}

	// 2- Filter out unwanted fields that are not allowed to be updated
	const filteredBody = {};
	const allowedFields = [
		"name",
		"email",
		"username",
		"collegeName",
		"course",
		"semester",
		"studentType",
		"phoneNumber",
		"bio",
		"linkedinProfile",
		"githubProfile",
		"interests",
		"skills",
	];
	allowedFields.forEach((field) => {
		if (req.body[field] !== undefined) filteredBody[field] = req.body[field];
	});

	// 3- Update user document
	// If username provided, ensure it's unique
	if (filteredBody.username) {
		const exists = await User.findOne({
			_username: undefined,
			username: filteredBody.username.toLowerCase(),
			_id: { $ne: req.user.id },
		});
		if (exists) {
			return next({ statusCode: 400, message: "Username already taken" });
		}
	}

	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: "success",
		data: {
			user: updatedUser,
		},
	});
});

// Update user upload statistics
export const updateUploadStats = catchAsync(async (req, res, next) => {
	const { userId, type } = req.body; // type: 'upload', 'approve', 'reject'

	if (!userId || !type) {
		return next({
			statusCode: 400,
			message: "User ID and type are required",
		});
	}

	const user = await User.findById(userId);
	if (!user) {
		return next({
			statusCode: 404,
			message: "User not found",
		});
	}

	// Update statistics based on type
	switch (type) {
		case "upload":
			user.totalUploads += 1;
			break;
		case "approve":
			user.approvedUploads += 1;
			break;
		case "reject":
			user.rejectedUploads += 1;
			break;
		default:
			return next({
				statusCode: 400,
				message: "Invalid type. Use 'upload', 'approve', or 'reject'",
			});
	}

	await user.save({ validateBeforeSave: false });

	res.status(200).json({
		status: "success",
		data: {
			user: {
				id: user._id,
				totalUploads: user.totalUploads,
				approvedUploads: user.approvedUploads,
				rejectedUploads: user.rejectedUploads,
			},
		},
	});
});

// Get user profile with full details
export const getUserProfile = catchAsync(async (req, res, next) => {
	const user = await User.findById(req.user.id).select("-password");

	if (!user) {
		return next({
			statusCode: 404,
			message: "User not found",
		});
	}

	res.status(200).json({
		status: "success",
		data: {
			user,
		},
	});
});

// Sync user upload statistics for all users
export const syncUserStats = catchAsync(async (req, res, next) => {
	try {
		const Note = (await import("../models/noteModel.js")).default;

		const users = await User.find({});
		let updatedCount = 0;

		for (const user of users) {
			const totalUploads = await Note.countDocuments({ uploadedBy: user._id });
			const approvedUploads = await Note.countDocuments({
				uploadedBy: user._id,
				status: "approved",
			});
			const rejectedUploads = await Note.countDocuments({
				uploadedBy: user._id,
				status: "rejected",
			});

			await User.findByIdAndUpdate(user._id, {
				totalUploads,
				approvedUploads,
				rejectedUploads,
			});

			console.log(
				`✅ Synced stats for user ${user.name}: Total: ${totalUploads}, Approved: ${approvedUploads}, Rejected: ${rejectedUploads}`
			);
			updatedCount++;
		}

		res.status(200).json({
			status: "success",
			message: `Synced upload statistics for ${updatedCount} users`,
			data: { updatedCount },
		});
	} catch (error) {
		console.error("❌ Error syncing user stats:", error);
		return next({
			statusCode: 500,
			message: "Failed to sync user statistics",
		});
	}
});

// Forgot Password - Generate reset token and send email
export const forgotPasswordViaEmail = catchAsync(async (req, res, next) => {
	// 1) Get user based on POSTed email
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		return next({
			statusCode: 404,
			message: "There is no user with that email address.",
		});
	}

	// 2) Generate the random reset token
	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	// 3) Send it to user's email
	try {
		const resetURL = `${
			process.env.CLIENT_URL || "http://localhost:5173"
		}/reset-password/${resetToken}`;

		await sendPasswordResetEmail({
			to: user.email,
			resetURL,
			userName: user.name,
		});

		res.status(200).json({
			status: "success",
			message: "Password reset link sent to your email address!",
		});
	} catch (err) {
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save({ validateBeforeSave: false });

		console.error(
			"Email sending error:",
			err?.code || err?.responseCode || "",
			err?.message || err
		);
		return next({
			statusCode: 500,
			message: "There was an error sending the email. Try again later.",
		});
	}
});

// Reset Password - Verify token and update password
export const resetPasswordViaEmail = catchAsync(async (req, res, next) => {
	// 1) Get user based on the token
	const hashedToken = crypto
		.createHash("sha256")
		.update(req.params.token)
		.digest("hex");

	const user = await User.findOne({
		passwordResetToken: hashedToken,
		passwordResetExpires: { $gt: Date.now() },
	});

	// 2) If token has not expired, and there is user, set the new password
	if (!user) {
		return next({
			statusCode: 400,
			message: "Token is invalid or has expired",
		});
	}

	user.password = req.body.password;
	user.passwordConfirm = req.body.passwordConfirm;
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;
	await user.save();

	// 3) Update changedPasswordAt property for the user (done in userModel pre-save middleware)

	// 4) Send notification about password change
	await notifyPasswordChange(req, user._id, {
		kind: "reset",
		method: "email_reset",
	});

	// 5) Log the user in, send JWT
	const token = signToken(user._id, "password");

	res.status(200).json({
		status: "success",
		token,
		message: "Password has been reset successfully!",
		data: {
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		},
	});
});
