import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import { protect } from "./authController.js";
import FriendGroup from "../models/friendGroupModel.js";

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

// ===== Friend Groups =====

// GET /api/friends/groups - list my groups with member basic info
export const listGroups = catchAsync(async (req, res) => {
	const groups = await FriendGroup.find({ ownerUser: req.user._id })
		.sort({ createdAt: -1 })
		.populate("members", "username name email")
		.lean();
	const data = groups.map((g) => ({
		id: g._id,
		name: g.name,
		description: g.description || "",
		members: (g.members || []).map((m) => ({
			id: m._id,
			username: m.username,
			name: m.name,
			email: m.email,
		})),
		createdAt: g.createdAt,
		updatedAt: g.updatedAt,
	}));
	res.json({ status: "success", data: { groups: data } });
});

// POST /api/friends/groups { name, description }
export const createGroup = catchAsync(async (req, res, next) => {
	const { name, description } = req.body || {};
	if (!name || !String(name).trim())
		return next({ statusCode: 400, message: "Group name is required" });
	const doc = await FriendGroup.create({
		ownerUser: req.user._id,
		name: String(name).trim(),
		description: String(description || "").trim(),
		members: [],
	});
	res
		.status(201)
		.json({
			status: "success",
			data: {
				group: {
					id: doc._id,
					name: doc.name,
					description: doc.description,
					members: [],
				},
			},
		});
});

// PATCH /api/friends/groups/:id { name?, description? }
export const updateGroup = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { name, description } = req.body || {};
	const group = await FriendGroup.findOne({ _id: id, ownerUser: req.user._id });
	if (!group) return next({ statusCode: 404, message: "Group not found" });
	if (name && String(name).trim()) group.name = String(name).trim();
	if (typeof description === "string") group.description = description;
	await group.save();
	res.json({
		status: "success",
		data: {
			group: {
				id: group._id,
				name: group.name,
				description: group.description,
			},
		},
	});
});

// DELETE /api/friends/groups/:id
export const deleteGroup = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const del = await FriendGroup.deleteOne({ _id: id, ownerUser: req.user._id });
	if (!del.deletedCount)
		return next({ statusCode: 404, message: "Group not found" });
	res.json({ status: "success", message: "Group deleted" });
});

// POST /api/friends/groups/:id/members { username }
export const addGroupMember = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { username } = req.body || {};
	if (!username) return next({ statusCode: 400, message: "Username required" });
	const group = await FriendGroup.findOne({ _id: id, ownerUser: req.user._id });
	if (!group) return next({ statusCode: 404, message: "Group not found" });
	const user = await User.findOne({ username: username.toLowerCase() }).select(
		"_id"
	);
	if (!user) return next({ statusCode: 404, message: "User not found" });
	if (!group.members.some((m) => String(m) === String(user._id))) {
		group.members.push(user._id);
		await group.save();
	}
	res.json({ status: "success", message: "Member added" });
});

// DELETE /api/friends/groups/:id/members { username }
export const removeGroupMember = catchAsync(async (req, res, next) => {
	const { id } = req.params;
	const { username } = req.body || {};
	if (!username) return next({ statusCode: 400, message: "Username required" });
	const group = await FriendGroup.findOne({ _id: id, ownerUser: req.user._id });
	if (!group) return next({ statusCode: 404, message: "Group not found" });
	const user = await User.findOne({ username: username.toLowerCase() }).select(
		"_id"
	);
	if (!user) return next({ statusCode: 404, message: "User not found" });
	group.members = group.members.filter((m) => String(m) !== String(user._id));
	await group.save();
	res.json({ status: "success", message: "Member removed" });
});
