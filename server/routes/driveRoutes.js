import express from "express";
import { Readable } from "stream";
import { protect } from "../controllers/authController.js";
import { upload, handleMulterError } from "../middleware/upload.js";
import DriveService from "../services/driveService.js";
import User from "../models/userModel.js";
import DriveShare from "../models/driveShareModel.js";
import eventBus from "../utils/eventBus.js";
import FriendGroup from "../models/friendGroupModel.js";

const router = express.Router();

// List personal Drive files for the authenticated user
router.get("/files", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken) {
			return res.status(400).json({
				success: false,
				message:
					"Google is not connected. Please login via Google and grant Drive access.",
			});
		}
		const parentId = req.query.parentId || undefined;
		const files = await DriveService.listFiles(user, parentId);
		res.json({ success: true, data: { files } });
	} catch (err) {
		console.error("Drive list error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to list Drive files",
		});
	}
});

// Create a subfolder inside the user's Personal Drive folder
router.post("/folders", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken)
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });
		const { name } = req.body || {};
		if (!name || !String(name).trim())
			return res
				.status(400)
				.json({ success: false, message: "Folder name is required" });

		const accessToken = await DriveService.getAccessToken(user);
		const parentId = await DriveService.ensureUserFolder(user);
		const metadata = {
			name: String(name).trim(),
			mimeType: "application/vnd.google-apps.folder",
			parents: [parentId],
		};
		const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(metadata),
		});
		if (!createRes.ok) {
			const text = await createRes.text();
			return res
				.status(500)
				.json({ success: false, message: `Failed to create folder: ${text}` });
		}
		const folder = await createRes.json();
		return res.json({ success: true, data: { folder } });
	} catch (err) {
		console.error("Drive create folder error:", err);
		res
			.status(500)
			.json({
				success: false,
				message: err.message || "Failed to create folder",
			});
	}
});

// List subfolders in user's Personal Drive folder
router.get("/folders", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken)
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });
		const accessToken = await DriveService.getAccessToken(user);
		const parentId = await DriveService.ensureUserFolder(user);
		const params = new URLSearchParams({
			q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
			fields: "files(id,name,mimeType,modifiedTime)",
			orderBy: "modifiedTime desc",
			pageSize: "200",
		});
		const res2 = await fetch(
			`https://www.googleapis.com/drive/v3/files?${params.toString()}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);
		if (!res2.ok) {
			const text = await res2.text();
			return res
				.status(500)
				.json({ success: false, message: `Failed to list folders: ${text}` });
		}
		const json = await res2.json();
		res.json({ success: true, data: { folders: json.files || [] } });
	} catch (err) {
		console.error("Drive list folders error:", err);
		res
			.status(500)
			.json({
				success: false,
				message: err.message || "Failed to list folders",
			});
	}
});

// Share a folder and optionally all its contents with a user or group
router.post("/folders/:id/share", protect, async (req, res) => {
	try {
		const { id } = req.params; // folder id
		const {
			username,
			groupId,
			includeContents = true,
			role = "reader",
		} = req.body || {};
		if (!username && !groupId) {
			return res
				.status(400)
				.json({ success: false, message: "username or groupId required" });
		}
		const owner = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId username email name"
		);
		if (!owner)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!owner.googleRefreshToken)
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });
		// Verify folder is inside owner's app folder
		try {
			const accessToken = await DriveService.getAccessToken(owner);
			const parentsRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,mimeType`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (!parentsRes.ok) {
				const text = await parentsRes.text();
				return res
					.status(403)
					.json({
						success: false,
						message: `Not allowed to share this folder: ${text}`,
					});
			}
			const meta = await parentsRes.json();
			const parents = meta.parents || [];
			if (
				!parents.includes(owner.googleDriveFolderId) ||
				meta.mimeType !== "application/vnd.google-apps.folder"
			) {
				return res
					.status(403)
					.json({
						success: false,
						message: "You can only share folders created via this app.",
					});
			}
		} catch (e) {
			return res
				.status(403)
				.json({
					success: false,
					message: "You can only share folders created via this app.",
				});
		}

		const recipients = [];
		if (username) {
			const user = await User.findOne({
				username: username.toLowerCase(),
			}).select("_id username email");
			if (!user)
				return res
					.status(404)
					.json({ success: false, message: "Recipient not found" });
			if (String(user._id) === String(owner._id))
				return res
					.status(400)
					.json({ success: false, message: "Cannot share with yourself" });
			recipients.push(user);
		}
		if (groupId) {
			const group = await FriendGroup.findOne({
				_id: groupId,
				ownerUser: owner._id,
			}).populate("members", "username email");
			if (!group)
				return res
					.status(404)
					.json({ success: false, message: "Group not found" });
			for (const m of group.members || []) {
				if (String(m._id) !== String(owner._id))
					recipients.push({ _id: m._id, username: m.username, email: m.email });
			}
		}

		// Deduplicate recipients by _id
		const byId = new Map();
		for (const r of recipients) byId.set(String(r._id), r);
		const finalRecipients = Array.from(byId.values());

		// Share the folder and (optional) contents
		const accessToken = await DriveService.getAccessToken(owner);
		const shareOne = async (fileId, r) => {
			return DriveService.shareFile(owner, {
				fileId,
				recipientEmail: r.email,
				role: ["reader", "commenter", "writer"].includes(role)
					? role
					: "reader",
			});
		};

		// folder meta for record
		let folderName = "";
		try {
			const metaRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (metaRes.ok) {
				const m = await metaRes.json();
				folderName = m.name || "";
			}
		} catch {}

		for (const r of finalRecipients) {
			await shareOne(id, r);
			// Record a DriveShare for the folder itself (using fileId as folder id)
			await DriveShare.findOneAndUpdate(
				{ ownerUser: owner._id, recipientUser: r._id, fileId: id },
				{
					fileId: id,
					fileName: folderName || id,
					mimeType: "application/vnd.google-apps.folder",
					size: 0,
					webViewLink: `https://drive.google.com/drive/folders/${id}`,
					ownerUser: owner._id,
					ownerUsername: owner.username || "",
					recipientUser: r._id,
					recipientUsername: r.username || "",
					role: ["reader", "commenter", "writer"].includes(role)
						? role
						: "reader",
					sharedAt: new Date(),
					...(groupId ? { groupId } : {}),
				},
				{ new: true, upsert: true, setDefaultsOnInsert: true }
			);
		}

		if (includeContents) {
			// list all non-trashed children files in folder (non-recursive for now)
			const params = new URLSearchParams({
				q: `'${id}' in parents and trashed = false`,
				fields: "files(id,name,mimeType,size,webViewLink)",
				pageSize: "200",
			});
			const listRes = await fetch(
				`https://www.googleapis.com/drive/v3/files?${params.toString()}`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			const listJson = listRes.ok ? await listRes.json() : { files: [] };
			for (const f of listJson.files || []) {
				for (const r of finalRecipients) {
					await shareOne(f.id, r);
					await DriveShare.findOneAndUpdate(
						{ ownerUser: owner._id, recipientUser: r._id, fileId: f.id },
						{
							fileId: f.id,
							fileName: f.name || f.id,
							mimeType: f.mimeType || "",
							size: Number(f.size || 0),
							webViewLink:
								f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
							ownerUser: owner._id,
							ownerUsername: owner.username || "",
							recipientUser: r._id,
							recipientUsername: r.username || "",
							role: ["reader", "commenter", "writer"].includes(role)
								? role
								: "reader",
							sharedAt: new Date(),
							...(groupId ? { groupId } : {}),
						},
						{ new: true, upsert: true, setDefaultsOnInsert: true }
					);
				}
			}
		}

		// Notify via SSE
		for (const r of finalRecipients) {
			eventBus.sendToUser(String(r._id), "drive:newShare", {
				type: "new_share",
				fileId: id,
				ownerUser: String(owner._id),
				fileName: folderName || id,
			});
		}
		eventBus.sendToUser(String(owner._id), "drive:sharesUpdated", {
			type: "shares_updated",
			folderId: id,
			recipients: finalRecipients.map((r) => String(r._id)),
		});

		return res.json({
			success: true,
			data: { sharedWith: finalRecipients.length },
		});
	} catch (err) {
		console.error("Drive folder share error:", err);
		res
			.status(500)
			.json({
				success: false,
				message: err.message || "Failed to share folder",
			});
	}
});

// Download a file from user's Drive (proxy with auth), only for app-owned files
router.get("/files/:id/download", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken)
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });

		const { id } = req.params;

		// Decide whose token to use: try current user first, then owner if shared
		let tokenOwner = user;
		let accessToken = await DriveService.getAccessToken(tokenOwner);
		let metaRes = await fetch(
			`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,name,mimeType`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (!metaRes.ok) {
			const share = await DriveShare.findOne({
				recipientUser: user._id,
				fileId: id,
			});
			if (!share) {
				const text = await metaRes.text();
				return res.status(403).json({
					success: false,
					message: `Not allowed to download: ${text}`,
				});
			}
			const owner = await User.findById(share.ownerUser).select(
				"googleRefreshToken googleDriveFolderId"
			);
			if (!owner?.googleRefreshToken) {
				return res.status(403).json({
					success: false,
					message: "Owner cannot grant access at this time.",
				});
			}
			tokenOwner = owner;
			accessToken = await DriveService.getAccessToken(tokenOwner);
			metaRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,name,mimeType`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (!metaRes.ok) {
				const text = await metaRes.text();
				if (metaRes.status === 404) {
					await DriveShare.deleteOne({ _id: share._id });
					return res.status(404).json({
						success: false,
						message:
							"File not found. The owner may have removed the file. This share has been cleaned.",
					});
				}
				return res.status(403).json({
					success: false,
					message: `Not allowed to download: ${text}`,
				});
			}
		}
		const meta = await metaRes.json();

		// Optional: ensure it's within tokenOwner's app folder if tokenOwner is the current user
		if (String(tokenOwner._id) === String(user._id)) {
			const parents = meta.parents || [];
			if (!parents.includes(user.googleDriveFolderId)) {
				const share = await DriveShare.findOne({
					recipientUser: user._id,
					fileId: id,
				});
				if (!share) {
					return res.status(403).json({
						success: false,
						message:
							"You can only download files uploaded via this app or ones shared with you via this app.",
					});
				}
			}
		}

		// Stream content
		const dlRes = await fetch(
			`https://www.googleapis.com/drive/v3/files/${id}?alt=media&acknowledgeAbuse=true`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (!dlRes.ok) {
			const text = await dlRes.text();
			if (dlRes.status === 404) {
				// Clean any share record for this file from this owner (if exists)
				await DriveShare.deleteMany({ ownerUser: tokenOwner._id, fileId: id });
			}
			return res
				.status(dlRes.status)
				.json({ success: false, message: text || "Failed to download" });
		}

		const fileName = meta.name || `file-${id}`;
		const mime = meta.mimeType || "application/octet-stream";
		res.setHeader("Content-Type", mime);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
		);
		const dlLen = dlRes.headers.get("content-length");
		if (dlLen) res.setHeader("Content-Length", dlLen);

		const body = dlRes.body;
		if (body && typeof body.getReader === "function" && Readable.fromWeb) {
			const nodeStream = Readable.fromWeb(body);
			nodeStream.pipe(res);
		} else if (body && typeof body.pipe === "function") {
			body.pipe(res);
		} else {
			const arrBuf = await dlRes.arrayBuffer();
			res.end(Buffer.from(arrBuf));
		}
	} catch (err) {
		console.error("Drive download error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to download file",
		});
	}
});

// View a file inline (same checks), useful to avoid Google login and stay in-page
router.get("/files/:id/view", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken)
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });

		const { id } = req.params;

		// Decide whose token to use (self first, else owner if shared)
		let tokenOwner = user;
		let accessToken = await DriveService.getAccessToken(tokenOwner);
		let metaRes = await fetch(
			`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,name,mimeType`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (!metaRes.ok) {
			const share = await DriveShare.findOne({
				recipientUser: user._id,
				fileId: id,
			});
			if (!share) {
				const text = await metaRes.text();
				return res
					.status(403)
					.json({ success: false, message: `Not allowed to view: ${text}` });
			}
			const owner = await User.findById(share.ownerUser).select(
				"googleRefreshToken googleDriveFolderId"
			);
			if (!owner?.googleRefreshToken) {
				return res.status(403).json({
					success: false,
					message: "Owner cannot grant access at this time.",
				});
			}
			tokenOwner = owner;
			accessToken = await DriveService.getAccessToken(tokenOwner);
			metaRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?fields=parents,name,mimeType`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (!metaRes.ok) {
				const text = await metaRes.text();
				if (metaRes.status === 404) {
					await DriveShare.deleteOne({ _id: share._id });
					return res.status(404).json({
						success: false,
						message:
							"File not found. The owner may have removed the file. This share has been cleaned.",
					});
				}
				return res
					.status(403)
					.json({ success: false, message: `Not allowed to view: ${text}` });
			}
		}
		const meta = await metaRes.json();

		const fileRes = await fetch(
			`https://www.googleapis.com/drive/v3/files/${id}?alt=media&acknowledgeAbuse=true`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (!fileRes.ok) {
			const text = await fileRes.text();
			if (fileRes.status === 404) {
				await DriveShare.deleteMany({ ownerUser: tokenOwner._id, fileId: id });
			}
			return res
				.status(fileRes.status)
				.json({ success: false, message: text || "Failed to view" });
		}

		const fileName = meta.name || `file-${id}`;
		const mime = meta.mimeType || "application/octet-stream";
		res.setHeader("Content-Type", mime);
		res.setHeader(
			"Content-Disposition",
			`inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
		);
		const viewLen = fileRes.headers.get("content-length");
		if (viewLen) res.setHeader("Content-Length", viewLen);

		const body = fileRes.body;
		if (body && typeof body.getReader === "function" && Readable.fromWeb) {
			const nodeStream = Readable.fromWeb(body);
			nodeStream.pipe(res);
		} else if (body && typeof body.pipe === "function") {
			body.pipe(res);
		} else {
			const arrBuf = await fileRes.arrayBuffer();
			res.end(Buffer.from(arrBuf));
		}
	} catch (err) {
		console.error("Drive view error:", err);
		res
			.status(500)
			.json({ success: false, message: err.message || "Failed to view file" });
	}
});

// Upload personal file(s) to user's Google Drive
router.post(
	"/files",
	protect,
	upload.array("files", 50),
	async (req, res) => {
		try {
			const user = await User.findById(req.user._id).select(
				"googleRefreshToken googleDriveFolderId"
			);
			if (!user)
				return res
					.status(404)
					.json({ success: false, message: "User not found" });
			if (!user.googleRefreshToken) {
				return res.status(400).json({
					success: false,
					message:
						"Google is not connected. Please login via Google and grant Drive access.",
				});
			}

			const files = req.files || [];
			if (!files.length) {
				return res
					.status(400)
					.json({ success: false, message: "No files provided" });
			}

			// Optional parent folder id to upload into (for hierarchy)
			const parentId = req.body.parentId || undefined;

			const results = [];
			for (const f of files) {
				try {
					const uploaded = await DriveService.uploadFile(user, f, parentId);
					results.push({ success: true, file: { ...uploaded } });
				} catch (e) {
					results.push({
						success: false,
						fileName: f.originalname,
						error: e.message,
					});
				}
			}

			res.json({ success: true, data: { results } });
		} catch (err) {
			console.error("Drive upload error:", err);
			res.status(500).json({
				success: false,
				message: err.message || "Failed to upload files to Drive",
			});
		}
	},
	handleMulterError
);

// Delete a file from user's Drive
router.delete("/files/:id", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken) {
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });
		}
		const { id } = req.params;

		// Verify the file belongs to the user's app folder (privacy)
		try {
			const accessToken = await DriveService.getAccessToken(user);
			const metaRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?fields=parents`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (!metaRes.ok) {
				const text = await metaRes.text();
				return res.status(403).json({
					success: false,
					message: `Not allowed to delete this file: ${text}`,
				});
			}
			const meta = await metaRes.json();
			const parents = meta.parents || [];
			if (!parents.includes(user.googleDriveFolderId)) {
				return res.status(403).json({
					success: false,
					message: "You can only delete files uploaded via this app.",
				});
			}
		} catch (e) {
			return res.status(403).json({
				success: false,
				message: "You can only delete files uploaded via this app.",
			});
		}

		await DriveService.deleteFile(user, id);

		// Also remove any share records for this file (so it disappears from both owner and recipients lists)
		let sharesDeleted = 0;
		try {
			// Collect recipients first to notify them after delete
			const toNotify = await DriveShare.find({
				ownerUser: user._id,
				fileId: id,
			}).select("recipientUser fileId fileName");

			const del = await DriveShare.deleteMany({
				ownerUser: user._id,
				fileId: id,
			});
			sharesDeleted = del?.deletedCount || 0;

			// Notify recipients and owner via SSE to refresh their share lists immediately
			const recipientIds = toNotify.map((s) => String(s.recipientUser));
			eventBus.sendToUsers(recipientIds, "drive:shareRemoved", {
				type: "share_removed",
				fileId: id,
				ownerUser: String(user._id),
				reason: "owner_deleted",
			});
			eventBus.sendToUser(String(user._id), "drive:sharesUpdated", {
				type: "shares_updated",
				fileId: id,
				sharesDeleted,
			});
		} catch (e) {
			console.warn("DriveShare cleanup failed for file", id, e?.message);
		}

		res.json({ success: true, data: { sharesDeleted } });
	} catch (err) {
		console.error("Drive delete error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to delete file",
		});
	}
});

// Share a file with another user by username
router.post("/files/:id/share", protect, async (req, res) => {
	try {
		const { id } = req.params;
		const { username, groupId, role } = req.body || {};
		if (!username && !groupId)
			return res
				.status(400)
				.json({
					success: false,
					message: "Recipient username or groupId is required",
				});

		const owner = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId username email name"
		);
		if (!owner)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!owner.googleRefreshToken)
			return res
				.status(400)
				.json({ success: false, message: "Google not connected" });

		const recipients = [];
		if (username) {
			const r = await User.findOne({ username: username.toLowerCase() }).select(
				"_id username email"
			);
			if (!r)
				return res
					.status(404)
					.json({ success: false, message: "Recipient not found" });
			if (String(r._id) === String(owner._id))
				return res
					.status(400)
					.json({ success: false, message: "Cannot share with yourself" });
			recipients.push(r);
		}
		if (groupId) {
			const group = await FriendGroup.findOne({
				_id: groupId,
				ownerUser: owner._id,
			}).populate("members", "username email");
			if (!group)
				return res
					.status(404)
					.json({ success: false, message: "Group not found" });
			for (const m of group.members || []) {
				if (String(m._id) !== String(owner._id)) {
					recipients.push({ _id: m._id, username: m.username, email: m.email });
				}
			}
		}
		// Deduplicate recipients
		const byId = new Map();
		for (const r of recipients) byId.set(String(r._id), r);
		const finalRecipients = Array.from(byId.values());

		// Verify the file belongs to the owner's app folder (privacy)
		try {
			const accessToken = await DriveService.getAccessToken(owner);
			const parentsRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?fields=parents`,
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			if (!parentsRes.ok) {
				const text = await parentsRes.text();
				return res.status(403).json({
					success: false,
					message: `Not allowed to share this file: ${text}`,
				});
			}
			const parentsMeta = await parentsRes.json();
			const parents = parentsMeta.parents || [];
			if (!parents.includes(owner.googleDriveFolderId)) {
				return res.status(403).json({
					success: false,
					message: "You can only share files uploaded via this app.",
				});
			}
		} catch (e) {
			return res.status(403).json({
				success: false,
				message: "You can only share files uploaded via this app.",
			});
		}

		// Ensure owner has access token and then call Drive permissions API
		try {
			for (const r of finalRecipients) {
				await DriveService.shareFile(owner, {
					fileId: id,
					recipientEmail: r.email,
					role: ["reader", "commenter", "writer"].includes(role)
						? role
						: "reader",
				});
			}
		} catch (e) {
			// Map specific Google Drive errors to cleaner client messages
			let status = 500;
			let message = e?.message || "Failed to share file";
			// Try to extract JSON from message like: "Failed to share file: 400 { ... }"
			const jsonStart = message.indexOf("{\n");
			if (jsonStart !== -1) {
				try {
					const jsonStr = message.slice(jsonStart);
					const g = JSON.parse(jsonStr);
					status = Number(g?.error?.code) || 500;
					const reason =
						g?.error?.errors?.[0]?.reason || g?.error?.status || "";
					const userMsg = g?.error?.message || "";
					if (String(reason).includes("abusiveContentRestriction")) {
						status = 400;
						message =
							"Google blocked sharing this file (abusiveContentRestriction). You cannot share this item because it may be flagged as inappropriate by Google. Please try another file or modify and re-upload.";
					} else if (userMsg) {
						message = userMsg;
					}
				} catch (_) {
					// ignore JSON parse failure, fall back to raw message
				}
			}
			return res.status(status).json({ success: false, message });
		}

		// Optionally get file name
		let fileName = "";
		let mimeType = "";
		let size = 0;
		let webViewLink = `https://drive.google.com/file/d/${id}/view`;
		try {
			const accessToken = await DriveService.getAccessToken(owner);
			const params = new URLSearchParams({
				fields: "id,name,mimeType,size,webViewLink",
			});
			const metaRes = await fetch(
				`https://www.googleapis.com/drive/v3/files/${id}?${params.toString()}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);
			if (metaRes.ok) {
				const meta = await metaRes.json();
				fileName = meta.name || fileName;
				mimeType = meta.mimeType || mimeType;
				size = Number(meta.size || 0);
				webViewLink = meta.webViewLink || webViewLink;
			}
		} catch {}

		// Save or update share record
		const records = [];
		for (const r of finalRecipients) {
			const record = await DriveShare.findOneAndUpdate(
				{ ownerUser: owner._id, recipientUser: r._id, fileId: id },
				{
					fileId: id,
					fileName,
					mimeType,
					size,
					webViewLink,
					ownerUser: owner._id,
					ownerUsername: owner.username || "",
					recipientUser: r._id,
					recipientUsername: r.username || "",
					role: ["reader", "commenter", "writer"].includes(role)
						? role
						: "reader",
					sharedAt: new Date(),
					...(groupId ? { groupId } : {}),
				},
				{ new: true, upsert: true, setDefaultsOnInsert: true }
			);
			records.push(record);
		}

		// Notify owner and recipients to refresh their lists
		eventBus.sendToUser(String(owner._id), "drive:sharesUpdated", {
			type: "shares_updated",
			action: "shared",
			fileId: id,
			recipients: finalRecipients.map((r) => String(r._id)),
		});
		for (const r of finalRecipients) {
			eventBus.sendToUser(String(r._id), "drive:newShare", {
				type: "new_share",
				fileId: id,
				ownerUser: String(owner._id),
				fileName,
			});
		}

		return res.json({ success: true, data: { shares: records } });
	} catch (err) {
		console.error("Drive share error:", err);
		res
			.status(500)
			.json({ success: false, message: err.message || "Failed to share file" });
	}
});

// List shares sent by me
router.get("/shares/sent", protect, async (req, res) => {
	try {
		let shares = await DriveShare.find({ ownerUser: req.user._id })
			.sort({ sharedAt: -1 })
			.lean();

		// Best-effort cleanup: remove entries whose files are gone in Drive
		try {
			const owner = await User.findById(req.user._id).select(
				"googleRefreshToken googleDriveFolderId"
			);
			if (owner?.googleRefreshToken) {
				const accessToken = await DriveService.getAccessToken(owner);
				const cleaned = [];
				for (const s of shares) {
					try {
						const meta = await fetch(
							`https://www.googleapis.com/drive/v3/files/${s.fileId}?fields=id`,
							{ headers: { Authorization: `Bearer ${accessToken}` } }
						);
						if (meta.ok) {
							cleaned.push(s);
						} else if (meta.status === 404) {
							await DriveShare.deleteOne({ _id: s._id });
						} else {
							// keep if transient error
							cleaned.push(s);
						}
					} catch {
						cleaned.push(s);
					}
				}
				shares = cleaned;
			}
		} catch (e) {
			console.warn("shares/sent cleanup skipped:", e?.message);
		}

		res.json({ success: true, data: { shares } });
	} catch (err) {
		console.error("Drive list sent shares error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to list shares",
		});
	}
});

// List shares shared with me
router.get("/shares/received", protect, async (req, res) => {
	try {
		let shares = await DriveShare.find({ recipientUser: req.user._id })
			.sort({ sharedAt: -1 })
			.lean();

		// Best-effort cleanup: remove entries if owner's file no longer exists
		const cleaned = [];
		for (const s of shares) {
			try {
				const owner = await User.findById(s.ownerUser).select(
					"googleRefreshToken"
				);
				if (!owner?.googleRefreshToken) {
					cleaned.push(s);
					continue;
				}
				const accessToken = await DriveService.getAccessToken(owner);
				const meta = await fetch(
					`https://www.googleapis.com/drive/v3/files/${s.fileId}?fields=id`,
					{ headers: { Authorization: `Bearer ${accessToken}` } }
				);
				if (meta.ok) cleaned.push(s);
				else if (meta.status === 404)
					await DriveShare.deleteOne({ _id: s._id });
				else cleaned.push(s);
			} catch {
				cleaned.push(s);
			}
		}
		shares = cleaned;

		res.json({ success: true, data: { shares } });
	} catch (err) {
		console.error("Drive list received shares error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to list shares",
		});
	}
});

export default router;
