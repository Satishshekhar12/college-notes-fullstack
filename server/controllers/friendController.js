import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import { protect } from "./authController.js";

// POST /api/friends/add { username }
export const addFriend = catchAsync(async (req, res, next) => {
	const { username } = req.body || {};
	if (!username || typeof username !== "string")
		return next({ statusCode: 400, message: "Username is required" });
	const me = await User.findById(req.user._id).select("_id username friends");
	if (!me) return next({ statusCode: 401, message: "Not authenticated" });
	const other = await User.findOne({ username: username.toLowerCase() }).select(
		"_id username friends"
	);
	if (!other)
		return next({
			statusCode: 404,
			message: "User not found with that username",
		});
	if (String(other._id) === String(me._id))
		return next({ statusCode: 400, message: "You cannot add yourself" });
	// If already friends, return success idempotently
	const already = me.friends?.some((id) => String(id) === String(other._id));
	if (!already) {
		me.friends = [...(me.friends || []), other._id];
		await me.save({ validateBeforeSave: false });
	}
	// Ensure bidirectional visibility: add me to other's friends if missing
	const otherHasMe = other.friends?.some((id) => String(id) === String(me._id));
	if (!otherHasMe) {
		other.friends = [...(other.friends || []), me._id];
		await other.save({ validateBeforeSave: false });
	}
	return res.status(200).json({
		status: "success",
		message: `Now friends with @${other.username}`,
		data: { friend: { id: other._id, username: other.username } },
	});
});

// DELETE /api/friends/remove { username }
export const removeFriend = catchAsync(async (req, res, next) => {
	const { username } = req.body || {};
	if (!username || typeof username !== "string")
		return next({ statusCode: 400, message: "Username is required" });
	const me = await User.findById(req.user._id).select("_id username friends");
	const other = await User.findOne({ username: username.toLowerCase() }).select(
		"_id username friends"
	);
	if (!other) return next({ statusCode: 404, message: "User not found" });
	me.friends = (me.friends || []).filter(
		(id) => String(id) !== String(other._id)
	);
	await me.save({ validateBeforeSave: false });
	// Also remove me from other
	other.friends = (other.friends || []).filter(
		(id) => String(id) !== String(me._id)
	);
	await other.save({ validateBeforeSave: false });
	return res.status(200).json({ status: "success", message: "Friend removed" });
});

// GET /api/friends/list
export const listFriends = catchAsync(async (req, res) => {
	const user = await User.findById(req.user._id)
		.select("friends")
		.populate("friends", "username name email");
	const friends = (user?.friends || []).map((f) => ({
		id: f._id,
		username: f.username,
		name: f.name,
		email: f.email,
	}));
	res.json({ status: "success", data: { friends } });
});

// GET /api/friends/search?query=foo
export const searchUsers = catchAsync(async (req, res) => {
	const q = String(req.query.query || "")
		.trim()
		.toLowerCase();
	if (!q) return res.json({ status: "success", data: { users: [] } });
	const users = await User.find({
		username: { $regex: `^${q}`, $options: "i" },
	})
		.select("username name")
		.limit(10)
		.lean();
	res.json({ status: "success", data: { users } });
});
