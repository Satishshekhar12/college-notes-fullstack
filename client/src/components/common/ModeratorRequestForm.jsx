import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

function ModeratorRequestForm({ onClose, onSuccess }) {
	const [formData, setFormData] = useState({
		reason: "",
		experience: "",
		additionalInfo: "",
		college: "",
		course: "",
		semester: "",
		previousContributions: "",
		linkedinProfile: "",
		githubProfile: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [existingRequest, setExistingRequest] = useState(null);

	useEffect(() => {
		checkExistingRequest();
	}, []);

	const checkExistingRequest = async () => {
		try {
			const token = localStorage.getItem("userToken");
			if (!token) {
				setError("You need to be logged in to apply for moderator role.");
				return;
			}

			const response = await fetch(
				`${API_BASE_URL}/api/moderator-requests/my-request`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				// Only block when there's a pending request; allow re-apply if approved/rejected
				if (data?.data?.request?.status === "pending") {
					setExistingRequest(data.data.request);
				} else {
					setExistingRequest(null);
				}
			}
		} catch (err) {
			console.error("Error checking existing request:", err);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (formData.reason.trim().length < 10) {
			setError("Reason must be at least 10 characters long");
			return;
		}

		// if (formData.experience.trim().length < 20) {
		// 	setError("Experience description must be at least 20 characters long");
		// 	return;
		// }

		try {
			setLoading(true);
			setError("");
			const token = localStorage.getItem("userToken");

			if (!token) {
				setError("You need to be logged in to apply for moderator role.");
				return;
			}

			const response = await fetch(
				`${API_BASE_URL}/api/moderator-requests/submit`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to submit request");
			}

			onSuccess?.("Your moderator request has been submitted successfully!");
			onClose?.();
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	if (existingRequest) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
					<div className="p-6">
						<h3 className="text-xl font-bold mb-4">
							Your Moderator Request Status
						</h3>

						<div className="mb-4 p-4 bg-blue-50 rounded-lg">
							<div className="flex items-center justify-between mb-2">
								<span className="font-semibold">Status:</span>
								<span
									className={`px-3 py-1 rounded-full text-sm font-medium ${
										existingRequest.status === "pending"
											? "bg-yellow-100 text-yellow-800"
											: existingRequest.status === "approved"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{existingRequest.status.toUpperCase()}
								</span>
							</div>
							<p className="text-sm text-gray-600 mb-2">
								<strong>Submitted:</strong>{" "}
								{new Date(existingRequest.createdAt).toLocaleDateString()}
							</p>

							{existingRequest.status === "pending" && (
								<div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
									<p className="text-yellow-800 text-sm">
										⏳ Your request is currently under review. You will be
										notified once the admin makes a decision.
									</p>
								</div>
							)}

							{existingRequest.status === "approved" && (
								<div className="bg-green-50 border border-green-200 p-3 rounded">
									<p className="text-green-800 text-sm">
										🎉 Congratulations! Your moderator request has been
										approved. You now have moderator privileges.
									</p>
								</div>
							)}

							{existingRequest.status === "rejected" && (
								<div className="bg-red-50 border border-red-200 p-3 rounded">
									<p className="text-red-800 text-sm">
										❌ Unfortunately, your moderator request was not approved at
										this time.
									</p>
								</div>
							)}

							{existingRequest.adminFeedback && (
								<div className="mt-3 p-3 bg-gray-50 border rounded">
									<p className="text-sm font-medium text-gray-700 mb-1">
										Admin Feedback:
									</p>
									<p className="text-sm text-gray-600">
										{existingRequest.adminFeedback}
									</p>
								</div>
							)}
						</div>

						<div className="flex space-x-3">
							<button
								onClick={onClose}
								className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
				<form onSubmit={handleSubmit} className="p-6">
					<h3 className="text-xl font-bold mb-4">Apply for Moderator Role</h3>

					<div className="mb-4 p-4 bg-blue-50 rounded-lg">
						<p className="text-blue-800 text-sm">
							<strong>About Moderator Role:</strong> Moderators help maintain
							quality by reviewing and approving uploaded content, ensuring
							academic integrity, and helping fellow students.
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-600 text-sm">{error}</p>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								College <span className="text-red-500">*</span>
							</label>
							<select
								name="college"
								value={formData.college}
								onChange={handleInputChange}
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							>
								<option value="">Select your college</option>
								<option value="bhu">BHU</option>
								<option value="nitk">NITK</option>
								<option value="other">Other</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Course <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="course"
								value={formData.course}
								onChange={handleInputChange}
								required
								placeholder="e.g., B.Tech Computer Science"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Current Semester (Optional)
						</label>
						<input
							type="text"
							name="semester"
							value={formData.semester}
							onChange={handleInputChange}
							placeholder="e.g., 6th Semester"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
						/>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Why do you want to become a moderator?{" "}
							<span className="text-red-500">*</span>
						</label>
						<textarea
							name="reason"
							value={formData.reason}
							onChange={handleInputChange}
							required
							rows="4"
							placeholder="Explain your motivation and how you plan to contribute as a moderator... (minimum 50 characters)"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
						/>
						<p className="text-xs text-gray-500 mt-1">
							{formData.reason.length}/10+ characters
						</p>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Relevant Experience (Optional){" "}
							<span className="text-red-500">*</span>
						</label>
						<textarea
							name="experience"
							value={formData.experience}
							onChange={handleInputChange}
							// required
							//not rquired
							rows="3"
							placeholder="Describe your relevant experience, educational background, tutoring, content creation, etc... (minimum 20 characters)"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
						/>
						<p className="text-xs text-gray-500 mt-1">
							{formData.experience.length}/20+ characters
						</p>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Previous Contributions (Optional)
						</label>
						<textarea
							name="previousContributions"
							value={formData.previousContributions}
							onChange={handleInputChange}
							rows="2"
							placeholder="Any previous contributions to educational platforms, open source projects, etc."
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
						/>
					</div>

					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Additional Information (Optional)
						</label>
						<textarea
							name="additionalInfo"
							value={formData.additionalInfo}
							onChange={handleInputChange}
							rows="2"
							placeholder="Any additional information you'd like to share..."
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								LinkedIn Profile (Optional)
							</label>
							<input
								type="url"
								name="linkedinProfile"
								value={formData.linkedinProfile}
								onChange={handleInputChange}
								placeholder="https://linkedin.com/in/yourprofile"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								GitHub Profile (Optional)
							</label>
							<input
								type="url"
								name="githubProfile"
								value={formData.githubProfile}
								onChange={handleInputChange}
								placeholder="https://github.com/yourusername"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>
					</div>

					<div className="flex space-x-3">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50"
						>
							{loading ? "Submitting..." : "Submit Application"}
						</button>
						<button
							type="button"
							onClick={onClose}
							className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default ModeratorRequestForm;
