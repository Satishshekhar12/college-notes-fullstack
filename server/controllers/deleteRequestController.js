import DeleteRequest from "../models/deleteRequestModel.js";
import Note from "../models/noteModel.js";
import S3Service from "../services/s3Service.js";
import { checkPermission } from "../middleware/authorize.js";
import { createNotification } from "./notificationController.js";

// Create a delete request (moderator can request on approved notes)
export const createDeleteRequest = async (req, res) => {
	try {
		const { noteId, reason } = req.body;
		if (!noteId) {
			return res
				.status(400)
				.json({ success: false, message: "noteId is required" });
		}

		const note = await Note.findById(noteId).populate("uploadedBy", "_id");
		if (!note)
			return res
				.status(404)
				.json({ success: false, message: "Note not found" });

		if (note.status !== "approved") {
			return res.status(400).json({
				success: false,
				message: "Delete requests are only for approved notes",
			});
		}

		// Moderators can request; admins/seniors can also request if desired
		if (!checkPermission(req.user.role, "moderator")) {
			return res
				.status(403)
				.json({ success: false, message: "Moderator access required" });
		}

		// Ensure no existing pending request for this note
		const existing = await DeleteRequest.findOne({
			note: noteId,
			status: "pending",
		});
		if (existing) {
			return res.status(409).json({
				success: false,
				message: "A pending delete request already exists for this note",
			});
		}

		const request = await DeleteRequest.create({
			note: noteId,
			requester: req.user._id,
			reason: reason?.trim(),
		});

		// Append to note moderation history
		note.moderationHistory.push({
			action: "delete_requested",
			timestamp: new Date(),
			moderatorId: req.user._id,
			reason: reason?.trim(),
		});
		await note.save();

		// Notify note owner that a delete was requested
		if (note.uploadedBy?._id) {
			await createNotification({
				user: note.uploadedBy._id,
				type: "delete_request_created",
				title: "Delete Requested",
				message: `A moderator requested deletion of your note: ${note.title}`,
				link: "/profile",
				metadata: { noteId: note._id, requestId: request._id },
			});
		}

		res.status(201).json({ success: true, data: request });
	} catch (err) {
		console.error("❌ Create Delete Request Error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to create delete request" });
	}
};

// List delete requests (moderator+ can view; default pending)
export const listDeleteRequests = async (req, res) => {
	try {
		const { status = "pending" } = req.query;
		if (!checkPermission(req.user.role, "moderator")) {
			return res
				.status(403)
				.json({ success: false, message: "Moderator access required" });
		}

		const query = status === "all" ? {} : { status };
		const requests = await DeleteRequest.find(query)
			.populate({
				path: "note",
				populate: [
					{ path: "uploadedBy", select: "name email" },
					{ path: "approvedBy", select: "name" },
				],
			})
			.populate("requester", "name email role")
			.populate("decidedBy", "name email role")
			.sort({ createdAt: -1 });

		res.json({ success: true, data: requests });
	} catch (err) {
		console.error("❌ List Delete Requests Error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to fetch delete requests" });
	}
};

// Approve a delete request (senior moderator or admin). Executes deletion.
export const approveDeleteRequest = async (req, res) => {
	try {
		const { id } = req.params; // delete request id
		const request = await DeleteRequest.findById(id).populate({
			path: "note",
			populate: { path: "uploadedBy", select: "_id" },
		});
		if (!request)
			return res
				.status(404)
				.json({ success: false, message: "Delete request not found" });
		if (request.status !== "pending") {
			return res
				.status(400)
				.json({ success: false, message: `Request already ${request.status}` });
		}

		if (!checkPermission(req.user.role, "senior moderator")) {
			return res.status(403).json({
				success: false,
				message: "Senior moderator or admin required",
			});
		}

		// Delete from S3 (best-effort)
		try {
			await S3Service.deleteFile(request.note.file.s3Key);
		} catch (s3Err) {
			console.error("⚠️ Failed to delete file from S3:", s3Err?.message);
		}

		const noteId = request.note?._id;
		const ownerId = request.note?.uploadedBy?._id;

		// Delete Note from DB
		await Note.findByIdAndDelete(noteId);

		// Mark request executed
		request.status = "executed";
		request.decidedBy = req.user._id;
		request.decidedAt = new Date();
		await request.save();

		// Notify requester and owner
		await createNotification({
			user: request.requester,
			type: "delete_request_executed",
			title: "Delete Request Approved",
			message: `Your delete request for a note was approved and executed.`,
			link: "/admin/approve-uploads",
			metadata: { requestId: request._id, noteId },
		});

		if (ownerId) {
			await createNotification({
				user: ownerId,
				type: "note_deleted",
				title: "Note Deleted",
				message: `Your note was deleted by moderators`,
				link: "/profile",
				metadata: { noteId },
			});
		}

		res.json({
			success: true,
			message: "Note deleted and request executed",
			data: { requestId: request._id },
		});
	} catch (err) {
		console.error("❌ Approve Delete Request Error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to approve delete request" });
	}
};

// Reject a delete request (senior moderator or admin)
export const rejectDeleteRequest = async (req, res) => {
	try {
		const { id } = req.params; // delete request id
		const { reason } = req.body;
		const request = await DeleteRequest.findById(id).populate({
			path: "note",
			populate: { path: "uploadedBy", select: "_id" },
		});
		if (!request)
			return res
				.status(404)
				.json({ success: false, message: "Delete request not found" });
		if (request.status !== "pending") {
			return res
				.status(400)
				.json({ success: false, message: `Request already ${request.status}` });
		}

		if (!checkPermission(req.user.role, "senior moderator")) {
			return res.status(403).json({
				success: false,
				message: "Senior moderator or admin required",
			});
		}

		request.status = "rejected";
		request.decidedBy = req.user._id;
		request.decidedAt = new Date();
		await request.save();

		// Add to note history
		if (request.note) {
			request.note.moderationHistory.push({
				action: "delete_request_rejected",
				timestamp: new Date(),
				moderatorId: req.user._id,
				reason: reason?.trim(),
			});
			await request.note.save();
		}

		// Notify requester
		await createNotification({
			user: request.requester,
			type: "delete_request_rejected",
			title: "Delete Request Rejected",
			message: `Your delete request was rejected${
				reason ? `: ${reason}` : ""
			}.`,
			link: "/admin/approve-uploads",
			metadata: { requestId: request._id },
		});

		res.json({ success: true, message: "Delete request rejected" });
	} catch (err) {
		console.error("❌ Reject Delete Request Error:", err);
		res
			.status(500)
			.json({ success: false, message: "Failed to reject delete request" });
	}
};
