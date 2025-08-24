import mongoose from "mongoose";

const friendGroupSchema = new mongoose.Schema(
	{
		ownerUser: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		name: { type: String, required: true, trim: true },
		description: { type: String, default: "" },
		members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true }
);

friendGroupSchema.index({ ownerUser: 1, name: 1 }, { unique: true });

const FriendGroup = mongoose.model("FriendGroup", friendGroupSchema);

export default FriendGroup;
