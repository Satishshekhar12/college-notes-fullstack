import mongoose from "mongoose";

const moderatorRequestSchema = new mongoose.Schema(
	{
		applicant: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "Applicant user ID is required"],
		},
		reason: {
			type: String,
			required: [true, "Reason for moderator request is required"],
			trim: true,
			minLength: [50, "Reason must be at least 50 characters long"],
			maxLength: [1000, "Reason cannot exceed 1000 characters"],
		},
		experience: {
			type: String,
			required: [true, "Experience description is required"],
			trim: true,
			minLength: [20, "Experience must be at least 20 characters long"],
			maxLength: [500, "Experience cannot exceed 500 characters"],
		},
		additionalInfo: {
			type: String,
			trim: true,
			maxLength: [1000, "Additional information cannot exceed 1000 characters"],
		},
		college: {
			type: String,
			required: [true, "College is required"],
			trim: true,
		},
		course: {
			type: String,
			required: [true, "Course is required"],
			trim: true,
		},
		semester: {
			type: String,
			trim: true,
		},
		status: {
			type: String,
			enum: ["pending", "approved", "rejected"],
			default: "pending",
		},
		reviewedBy: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
		},
		reviewedAt: {
			type: Date,
		},
		adminFeedback: {
			type: String,
			trim: true,
			maxLength: [1000, "Admin feedback cannot exceed 1000 characters"],
		},
		// Additional verification fields
		previousContributions: {
			type: String,
			trim: true,
		},
		linkedinProfile: {
			type: String,
			trim: true,
		},
		githubProfile: {
			type: String,
			trim: true,
		},
		// System fields
		ipAddress: {
			type: String,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Index for better query performance
moderatorRequestSchema.index({ applicant: 1, status: 1 });
moderatorRequestSchema.index({ createdAt: -1 });
moderatorRequestSchema.index({ status: 1, createdAt: -1 });

// Prevent multiple pending requests from same user
moderatorRequestSchema.index(
	{ applicant: 1, status: 1 },
	{
		unique: true,
		partialFilterExpression: { status: "pending" },
	}
);

// Virtual for request age
moderatorRequestSchema.virtual("requestAge").get(function () {
	return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // in days
});

// Pre middleware to populate applicant data
moderatorRequestSchema.pre(/^find/, function (next) {
	this.populate({
		path: "applicant",
		select:
			"name email createdAt totalUploads approvedUploads rejectedUploads role",
	});

	this.populate({
		path: "reviewedBy",
		select: "name email role",
	});

	next();
});

const ModeratorRequest = mongoose.model(
	"ModeratorRequest",
	moderatorRequestSchema
);

export default ModeratorRequest;
