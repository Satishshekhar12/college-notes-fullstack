import express from "express";
import { protect } from "../controllers/authController.js";
import {
	addFriend,
	removeFriend,
	listFriends,
	searchUsers,
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/add", protect, addFriend);
router.delete("/remove", protect, removeFriend);
router.get("/list", protect, listFriends);
router.get("/search", protect, searchUsers);

export default router;
