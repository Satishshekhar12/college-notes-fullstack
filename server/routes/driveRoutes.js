import express from "express";
import { Readable } from "stream";
import { protect } from "../controllers/authController.js";
import { upload, handleMulterError } from "../middleware/upload.js";
import DriveService from "../services/driveService.js";
import User from "../models/userModel.js";
import DriveShare from "../models/driveShareModel.js";

const router = express.Router();

// Connection status: check if user has a refresh token and the token grants drive.file scope
router.get("/status", protect, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"googleRefreshToken googleDriveFolderId"
		);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		if (!user.googleRefreshToken) {
			return res.json({
				success: true,
				data: {
					connected: false,
					scopeHasDriveFile: false,
					reason: "no_refresh_token",
				},
			});
		}

		// Try to get an access token; if this fails, user needs to reconnect
		let accessToken;
		try {
			accessToken = await DriveService.getAccessToken(user);
		} catch (e) {
			return res.json({
				success: true,
				data: {
					connected: false,
					scopeHasDriveFile: false,
					reason: "token_error",
				},
			});
		}

		// Verify scopes via tokeninfo (lightweight)
		try {
			const infoRes = await fetch(
				`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(
					accessToken
				)}`
			);
			if (!infoRes.ok) {
				return res.json({
					success: true,
					data: {
						connected: true,
						scopeHasDriveFile: false,
						reason: "tokeninfo_failed",
					},
				});
			}
			const info = await infoRes.json();
			const scopes = String(info.scope || "").split(/\s+/);
			const hasDriveFile = scopes.includes(
				"https://www.googleapis.com/auth/drive.file"
			);
			return res.json({
				success: true,
				data: {
					connected: true,
					scopeHasDriveFile: hasDriveFile,
					reason: hasDriveFile ? null : "scope_missing",
				},
			});
		} catch (e) {
			return res.json({
				success: true,
				data: {
					connected: true,
					scopeHasDriveFile: false,
					reason: "tokeninfo_error",
				},
			});
		}
	} catch (err) {
		console.error("Drive status error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to check status",
		});
	}
});

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
		const files = await DriveService.listFiles(user);
		res.json({ success: true, data: { files } });
	} catch (err) {
		console.error("Drive list error:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to list Drive files",
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
	upload.array("files", 10),
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

			const results = [];
			for (const f of files) {
				try {
					const uploaded = await DriveService.uploadFile(user, f);
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
			const del = await DriveShare.deleteMany({
				ownerUser: user._id,
				fileId: id,
			});
			sharesDeleted = del?.deletedCount || 0;
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
		const { username, role } = req.body || {};
		if (!username)
			return res
				.status(400)
				.json({ success: false, message: "Recipient username is required" });

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

		const recipient = await User.findOne({
			username: username.toLowerCase(),
		}).select("_id username email");
		if (!recipient)
			return res
				.status(404)
				.json({ success: false, message: "Recipient not found" });
		if (String(recipient._id) === String(owner._id))
			return res
				.status(400)
				.json({ success: false, message: "Cannot share with yourself" });

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
			await DriveService.shareFile(owner, {
				fileId: id,
				recipientEmail: recipient.email,
				role: ["reader", "commenter", "writer"].includes(role)
					? role
					: "reader",
			});
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
		const record = await DriveShare.findOneAndUpdate(
			{ ownerUser: owner._id, recipientUser: recipient._id, fileId: id },
			{
				fileId: id,
				fileName,
				mimeType,
				size,
				webViewLink,
				ownerUser: owner._id,
				ownerUsername: owner.username || "",
				recipientUser: recipient._id,
				recipientUsername: recipient.username || "",
				role: ["reader", "commenter", "writer"].includes(role)
					? role
					: "reader",
				sharedAt: new Date(),
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		);

		return res.json({ success: true, data: { share: record } });
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
