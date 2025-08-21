import mongoose from "mongoose";

const deleteRequestSchema = new mongoose.Schema(
	{
		note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true },
		requester: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		reason: { type: String, trim: true, maxlength: 1000 },
		status: {
			type: String,
			enum: ["pending", "approved", "rejected", "executed"],
			default: "pending",
		},
		decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		decidedAt: { type: Date },
	},
	{ timestamps: true }
);

// Unique: only one active pending request per note
deleteRequestSchema.index(
	{ note: 1, status: 1 },
	{ unique: true, partialFilterExpression: { status: "pending" } }
);

const DeleteRequest = mongoose.model("DeleteRequest", deleteRequestSchema);
export default DeleteRequest;
