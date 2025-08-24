import express from "express";
import fileRoutes from "./fileRoutes.js";
import adminRoutes from "./adminRoutes.js";
import noteRoutes from "./noteRoutes.js";
import visitRoutes from "./visitRoutes.js";
import moderatorRequestRoutes from "./moderatorRequestRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import authRoutes from "./authRoutes.js";
import driveRoutes from "./driveRoutes.js";
import contactRoutes from "./contactRoutes.js";
import friendRoutes from "./friendRoutes.js";
import eventBus from "../utils/eventBus.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const router = express.Router();

// Admin routes (includes signup and welcome)gi
router.use("/", adminRoutes);

// File routes (S3 functionality)
router.use("/api", fileRoutes);

// Note routes (note management system)
router.use("/api/notes", noteRoutes);

// Moderator request routes
router.use("/api/moderator-requests", moderatorRequestRoutes);

// Notification routes
router.use("/api/notifications", notificationRoutes);

// Visit counter routes
router.use("/api", visitRoutes);

// Google OAuth routes
router.use("/api", authRoutes);

// Google Drive personal files routes
router.use("/api/drive", driveRoutes);

// Contact form routes
router.use("/api", contactRoutes);

// Friends routes
router.use("/api/friends", friendRoutes);

// Server-Sent Events for lightweight real-time updates
router.get("/api/events", async (req, res) => {
	try {
		// Accept token from Authorization header or query parameter ?token=
		let token = null;
		const auth = req.headers.authorization || "";
		if (auth.startsWith("Bearer ")) token = auth.split(" ")[1];
		if (!token && req.query.token) token = String(req.query.token);
		if (!token) return res.status(401).end();

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id).select("_id");
		if (!user) return res.status(401).end();

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders?.();

		// initial ping
		res.write(`event: ping\n`);
		res.write(`data: {"ok":true}\n\n`);

		const userId = user._id;
		eventBus.addClient(userId, res);

		req.on("close", () => {
			eventBus.removeClient(userId, res);
			try {
				res.end();
			} catch {
				/* ignore */
			}
		});
	} catch (e) {
		return res.status(401).end();
	}
});

// Express route to check server health
router.get("/ping", (req, res) => {
	res.status(200).send("pong");
});

export default router;
