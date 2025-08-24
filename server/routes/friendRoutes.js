import express from "express";
import { protect } from "../controllers/authController.js";
import {
	addFriend,
	removeFriend,
	listFriends,
	searchUsers,
	listGroups,
	createGroup,
	updateGroup,
	deleteGroup,
	addGroupMember,
	removeGroupMember,
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/add", protect, addFriend);
router.delete("/remove", protect, removeFriend);
router.get("/list", protect, listFriends);
router.get("/search", protect, searchUsers);

// Friend groups
router.get("/groups", protect, listGroups);
router.post("/groups", protect, createGroup);
router.patch("/groups/:id", protect, updateGroup);
router.delete("/groups/:id", protect, deleteGroup);
router.post("/groups/:id/members", protect, addGroupMember);
router.delete("/groups/:id/members", protect, removeGroupMember);

export default router;
