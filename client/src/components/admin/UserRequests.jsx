import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/api";
import { getCurrentAdminUser } from "../../services/adminService";
// Add admin service helpers for users listing and role updates
import {
	fetchUsers as apiFetchUsers,
	updateUserRole as apiUpdateUserRole,
} from "../../services/adminService";

function UserRequests() {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [feedback, setFeedback] = useState("");
	const [stats, setStats] = useState({
		pending: 0,
		approved: 0,
		rejected: 0,
		total: 0,
	});

	const actingRole = getCurrentAdminUser()?.role || "user";
	const canApprove = ["senior moderator", "admin"].includes(actingRole);
	const canView = ["moderator", "senior moderator", "admin"].includes(
		actingRole
	);
	// New: admin-only visibility for full users list
	const canSeeUsersList = actingRole === "admin";

	// New: users list state
	const [users, setUsers] = useState([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [usersError, setUsersError] = useState("");
	const [updatingUserId, setUpdatingUserId] = useState(null);

	// New: role hierarchy helpers
	const ROLE_LEVEL = { user: 0, moderator: 1, "senior moderator": 2, admin: 3 };
	const actingLevel = ROLE_LEVEL[actingRole] ?? 0;
	const canModifyTarget = (targetRole) =>
		(ROLE_LEVEL[targetRole] ?? 0) < actingLevel; // strictly higher
	const canAssignRole = (newRole) => (ROLE_LEVEL[newRole] ?? 0) <= actingLevel;

	// Fetch all moderator requests
	useEffect(() => {
		if (canView) fetchModeratorRequests();
		else {
			setLoading(false);
			setError("Access denied");
		}
	}, [canView]);

	const fetchModeratorRequests = async () => {
		try {
			setLoading(true);
			setError("");
			const token = localStorage.getItem("adminToken");

			const response = await fetch(`${API_BASE_URL}/api/moderator-requests`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch moderator requests");
			}

			const data = await response.json();
			setRequests(data.data.requests);
			setStats(data.data.stats);
		} catch (err) {
			console.error("Error fetching moderator requests:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async (id, feedbackText = "") => {
		if (!canApprove) return alert("You do not have permission to approve.");
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/moderator-requests/${id}/approve`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						adminFeedback: feedbackText.trim(),
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to approve request");
			}

			await fetchModeratorRequests(); // Refresh the list
			setSelectedRequest(null);
			setFeedback("");
			alert("Moderator request approved successfully!");
		} catch (err) {
			alert("Error approving request: " + err.message);
		}
	};

	const handleReject = async (id, feedbackText) => {
		if (!canApprove) return alert("You do not have permission to reject.");
		if (!feedbackText.trim()) {
			alert("Please provide feedback for rejection");
			return;
		}

		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/moderator-requests/${id}/reject`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						adminFeedback: feedbackText.trim(),
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to reject request");
			}

			await fetchModeratorRequests(); // Refresh the list
			setSelectedRequest(null);
			setFeedback("");
			alert("Moderator request rejected successfully!");
		} catch (err) {
			alert("Error rejecting request: " + err.message);
		}
	};

	const openReviewModal = (request) => {
		setSelectedRequest(request);
		setFeedback("");
	};

	const pendingRequests = requests.filter((req) => req.status === "pending");
	const processedRequests = requests.filter((req) => req.status !== "pending");

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// New: fetch all users (admin-only)
	const loadAllUsers = useCallback(async () => {
		if (!canSeeUsersList) return;
		try {
			setUsersLoading(true);
			setUsersError("");
			const res = await apiFetchUsers();
			const list = res.data?.users || [];
			const toDateString = (value) => {
				if (!value) return "-";
				const d = new Date(value);
				return isNaN(d.getTime()) ? "-" : d.toISOString().split("T")[0];
			};
			setUsers(
				list.map((u) => ({
					id: u._id,
					name: u.name,
					email: u.email,
					role: u.role || "user",
					status: u.isActive === false ? "Inactive" : "Active",
					joinDate: toDateString(u.createdAt),
					totalUploads: u.totalUploads || 0,
					approvedUploads: u.approvedUploads || 0,
					rejectedUploads: u.rejectedUploads || 0,
				}))
			);
		} catch (e) {
			console.error(e);
			setUsersError(e.message || "Failed to load users");
		} finally {
			setUsersLoading(false);
		}
	}, [canSeeUsersList]);

	useEffect(() => {
		// ...existing code...
		if (canSeeUsersList) loadAllUsers();
	}, [canSeeUsersList, loadAllUsers]);

	// New: change user role from Users section
	const handleUserRoleChange = async (userId, nextRole, targetRoleForCheck) => {
		if (!canAssignRole(nextRole) || !canModifyTarget(targetRoleForCheck)) {
			alert(
				"You cannot modify users with equal/higher role or assign higher role."
			);
			return;
		}
		try {
			setUpdatingUserId(userId);
			await apiUpdateUserRole(userId, nextRole);
			await loadAllUsers();
		} catch (e) {
			alert(e.message || "Failed to update role");
		} finally {
			setUpdatingUserId(null);
		}
	};

	if (!canView) {
		return (
			<div className="flex justify-center items-center py-12">
				<p className="text-gray-600">Access denied.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading requests...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<div className="text-red-500 text-6xl mb-4">⚠️</div>
					<h3 className="text-lg font-semibold text-gray-800 mb-2">
						Error Loading Requests
					</h3>
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={fetchModeratorRequests}
						className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-200"
					>
						🔄 Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					👥 Moderator Requests
				</h2>
				<div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
					<p className="text-blue-800">
						<strong>Note:</strong> Users can request moderator privileges to
						help moderate content. Moderators can view, senior moderators/admin
						can approve.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
						<h3 className="text-lg font-semibold text-yellow-700">
							Pending Requests
						</h3>
						<p className="text-2xl font-bold text-yellow-800">
							{stats.pending}
						</p>
					</div>
					<div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
						<h3 className="text-lg font-semibold text-green-700">Approved</h3>
						<p className="text-2xl font-bold text-green-800">
							{stats.approved}
						</p>
					</div>
					<div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
						<h3 className="text-lg font-semibold text-red-700">Rejected</h3>
						<p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
					</div>
					<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
						<h3 className="text-lg font-semibold text-blue-700">Total</h3>
						<p className="text-2xl font-bold text-blue-800">{stats.total}</p>
					</div>
				</div>
			</div>

			{/* Pending Requests */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					Pending Requests ({pendingRequests.length})
				</h3>
				<div className="space-y-4">
					{pendingRequests.map((request) => (
						<div
							key={request._id}
							className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
						>
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
								<div className="lg:col-span-2">
									<h4 className="font-semibold text-lg text-gray-800 mb-2">
										{request.applicant.name}
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
										<p>
											<strong>Email:</strong> {request.applicant.email}
										</p>
										<p>
											<strong>College:</strong> {request.college}
										</p>
										<p>
											<strong>Course:</strong> {request.course}
										</p>
										<p>
											<strong>Request Date:</strong>{" "}
											{formatDate(request.createdAt)}
										</p>
										<p>
											<strong>User Since:</strong>{" "}
											{formatDate(request.applicant.createdAt)}
										</p>
										<p>
											<strong>Total Uploads:</strong>{" "}
											{request.applicant.totalUploads || 0}
										</p>
									</div>
									<div className="space-y-2 text-sm">
										<div>
											<strong className="text-gray-700">Reason:</strong>
											<p className="text-gray-600 mt-1">{request.reason}</p>
										</div>
										<div>
											<strong className="text-gray-700">Experience:</strong>
											<p className="text-gray-600 mt-1">{request.experience}</p>
										</div>
										{request.additionalInfo && (
											<div>
												<strong className="text-gray-700">
													Additional Information:
												</strong>
												<p className="text-gray-600 mt-1">
													{request.additionalInfo}
												</p>
											</div>
										)}
										{request.previousContributions && (
											<div>
												<strong className="text-gray-700">
													Previous Contributions:
												</strong>
												<p className="text-gray-600 mt-1">
													{request.previousContributions}
												</p>
											</div>
										)}
										{(request.linkedinProfile || request.githubProfile) && (
											<div>
												<strong className="text-gray-700">Profiles:</strong>
												<div className="mt-1 space-x-3">
													{request.linkedinProfile && (
														<a
															href={request.linkedinProfile}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:text-blue-800 text-xs"
														>
															LinkedIn
														</a>
													)}
													{request.githubProfile && (
														<a
															href={request.githubProfile}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:text-blue-800 text-xs"
														>
															GitHub
														</a>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
								<div className="flex flex-col justify-center space-y-2">
									{canApprove && (
										<>
											<button
												onClick={() => handleApprove(request._id)}
												className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
											>
												✅ Quick Approve
											</button>
											<button
												onClick={() => openReviewModal(request)}
												className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
											>
												📝 Review with Feedback
											</button>
											<button
												onClick={() => openReviewModal(request)}
												className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
											>
												❌ Reject
											</button>
										</>
									)}
									{!canApprove && (
										<p className="text-sm text-gray-500">View only</p>
									)}
								</div>
							</div>
						</div>
					))}
					{pendingRequests.length === 0 && (
						<div className="text-center py-8 text-gray-500">
							<p className="text-lg">No pending moderator requests</p>
							<p className="text-sm">
								New requests will appear here when users apply for moderator
								privileges
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Processed Requests */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					Recent Decisions ({processedRequests.length})
				</h3>
				<div className="space-y-3">
					{processedRequests.map((request) => (
						<div
							key={request._id}
							className="border rounded-lg p-3 bg-gray-50 flex justify-between items-center"
						>
							<div>
								<h5 className="font-medium">{request.applicant.name}</h5>
								<p className="text-sm text-gray-600">
									{request.applicant.email} • {formatDate(request.createdAt)}
								</p>
								{request.reviewedBy && (
									<p className="text-xs text-gray-500">
										Reviewed by {request.reviewedBy.name} on{" "}
										{formatDate(request.reviewedAt)}
									</p>
								)}
							</div>
							<div className="flex items-center space-x-2">
								<span
									className={`px-3 py-1 rounded-full text-sm font-medium ${
										request.status === "approved"
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{request.status.toUpperCase()}
								</span>
								{request.adminFeedback && (
									<button
										className="text-blue-500 hover:text-blue-700"
										title={request.adminFeedback}
									>
										💬
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Review Modal */}
			{selectedRequest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
						<h3 className="text-xl font-bold mb-4">
							Review Moderator Request: {selectedRequest.applicant.name}
						</h3>
						<div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
							<p>
								<strong>Email:</strong> {selectedRequest.applicant.email}
							</p>
							<p>
								<strong>College:</strong> {selectedRequest.college}
							</p>
							<p>
								<strong>Course:</strong> {selectedRequest.course}
							</p>
							{selectedRequest.semester && (
								<p>
									<strong>Semester:</strong> {selectedRequest.semester}
								</p>
							)}
							<p>
								<strong>User Since:</strong>{" "}
								{formatDate(selectedRequest.applicant.createdAt)}
							</p>
							<p>
								<strong>Total Uploads:</strong>{" "}
								{selectedRequest.applicant.totalUploads || 0}
							</p>
							<div>
								<strong>Reason:</strong>
								<p className="mt-1">{selectedRequest.reason}</p>
							</div>
							<div>
								<strong>Experience:</strong>
								<p className="mt-1">{selectedRequest.experience}</p>
							</div>
							{selectedRequest.additionalInfo && (
								<div>
									<strong>Additional Information:</strong>
									<p className="mt-1">{selectedRequest.additionalInfo}</p>
								</div>
							)}
							{selectedRequest.previousContributions && (
								<div>
									<strong>Previous Contributions:</strong>
									<p className="mt-1">
										{selectedRequest.previousContributions}
									</p>
								</div>
							)}
							{(selectedRequest.linkedinProfile ||
								selectedRequest.githubProfile) && (
								<div>
									<strong>Profiles:</strong>
									<div className="mt-1 space-x-4">
										{selectedRequest.linkedinProfile && (
											<a
												href={selectedRequest.linkedinProfile}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:text-blue-800"
											>
												LinkedIn Profile
											</a>
										)}
										{selectedRequest.githubProfile && (
											<a
												href={selectedRequest.githubProfile}
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:text-blue-800"
											>
												GitHub Profile
											</a>
										)}
									</div>
								</div>
							)}
						</div>
						<div className="mb-4">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Response/Feedback for Applicant:
							</label>
							<textarea
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
								rows="4"
								value={feedback}
								onChange={(e) => setFeedback(e.target.value)}
								placeholder="Provide feedback, welcome message, or reasons for rejection..."
							/>
						</div>
						<div className="flex space-x-3">
							{canApprove && (
								<button
									onClick={() => handleApprove(selectedRequest._id, feedback)}
									className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
								>
									✅ Approve as Moderator
								</button>
							)}
							{canApprove && (
								<button
									onClick={() => handleReject(selectedRequest._id, feedback)}
									className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
								>
									❌ Reject Request
								</button>
							)}
							<button
								onClick={() => setSelectedRequest(null)}
								className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{/* New: All Users (Admin Only) */}
			{canSeeUsersList && (
				<div className="bg-white rounded-lg shadow-md p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-xl font-bold text-gray-800">All Users</h3>
						<button
							onClick={loadAllUsers}
							className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600"
							disabled={usersLoading}
						>
							Refresh
						</button>
					</div>
					{usersError && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{usersError}
						</div>
					)}
					<div className="overflow-x-auto">
						<table className="w-full table-auto">
							<thead>
								<tr className="bg-gray-50">
									<th className="px-4 py-3 text-left">Name</th>
									<th className="px-4 py-3 text-left">Email</th>
									<th className="px-4 py-3 text-left">Role</th>
									<th className="px-4 py-3 text-left">Status</th>
									<th className="px-4 py-3 text-left">Join Date</th>
									<th className="px-4 py-3 text-left">
										Uploads (Approved/Rejected)
									</th>
									<th className="px-4 py-3 text-left">Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => {
									const isActive = u.status === "Active";
									const targetLevel = ROLE_LEVEL[u.role] ?? 0;
									const canModify = actingLevel > targetLevel;
									return (
										<tr key={u.id} className="border-b hover:bg-gray-50">
											<td className="px-4 py-3 font-medium">{u.name}</td>
											<td className="px-4 py-3">{u.email}</td>
											<td className="px-4 py-3">
												<span
													className={`px-2 py-1 rounded-full text-sm ${
														u.role === "senior moderator"
															? "bg-purple-100 text-purple-800"
															: u.role === "admin"
															? "bg-red-100 text-red-800"
															: u.role === "moderator"
															? "bg-blue-100 text-blue-800"
															: "bg-gray-100 text-gray-800"
													}`}
												>
													{u.role}
												</span>
											</td>
											<td className="px-4 py-3">
												<span
													className={`px-2 py-1 rounded-full text-sm ${
														isActive
															? "bg-green-100 text-green-800"
															: "bg-red-100 text-red-800"
													}`}
												>
													{isActive ? "Active" : "Inactive"}
												</span>
											</td>
											<td className="px-4 py-3">{u.joinDate}</td>
											<td className="px-4 py-3 text-sm">
												{u.totalUploads} ({u.approvedUploads}/
												{u.rejectedUploads})
											</td>
											<td className="px-4 py-3">
												<div className="flex flex-wrap gap-2">
													<button
														onClick={() =>
															handleUserRoleChange(u.id, "moderator", u.role)
														}
														className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
														disabled={
															updatingUserId === u.id ||
															!canModify ||
															!canAssignRole("moderator")
														}
													>
														Make Moderator
													</button>
													<button
														onClick={() =>
															handleUserRoleChange(
																u.id,
																"senior moderator",
																u.role
															)
														}
														className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
														disabled={
															updatingUserId === u.id ||
															!canModify ||
															!canAssignRole("senior moderator")
														}
													>
														Promote to Senior
													</button>
													{canAssignRole("admin") && canModify && (
														<button
															onClick={() =>
																handleUserRoleChange(u.id, "admin", u.role)
															}
															className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
															disabled={updatingUserId === u.id}
														>
															Make Admin
														</button>
													)}
													{u.role !== "user" && (
														<button
															onClick={() =>
																handleUserRoleChange(u.id, "user", u.role)
															}
															className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
															disabled={updatingUserId === u.id || !canModify}
														>
															Remove Role
														</button>
													)}
												</div>
											</td>
										</tr>
									);
								})}
								{users.length === 0 && !usersLoading && (
									<tr>
										<td
											colSpan="7"
											className="px-4 py-6 text-center text-gray-500"
										>
											No users found
										</td>
									</tr>
								)}
							</tbody>
						</table>
						{usersLoading && (
							<div className="text-center py-4 text-gray-500">
								Loading users...
							</div>
						)}
					</div>
				</div>
			)}

			{/* Implementation Status */}
			<div className="bg-green-50 border border-green-200 rounded-lg p-4">
				<h4 className="font-semibold text-green-800 mb-2">
					✅ Implemented Features:
				</h4>
				<ul className="text-sm text-green-700 space-y-1">
					<li>• User application form for moderator requests</li>
					<li>• Admin review and approval/rejection system</li>
					<li>• Automatic role assignment upon approval</li>
					<li>• Real-time statistics and status tracking</li>
					<li>• Comprehensive request details display</li>
				</ul>

				<h4 className="font-semibold text-yellow-800 mb-2 mt-4">
					🚧 Future Enhancement Ideas:
				</h4>
				<ul className="text-sm text-yellow-700 space-y-1">
					<li>• Email notifications for request status updates</li>
					<li>• Background verification checks</li>
					<li>• Moderator onboarding process</li>
					<li>• Request analytics and reporting</li>
				</ul>
			</div>
		</div>
	);
}

export default UserRequests;
