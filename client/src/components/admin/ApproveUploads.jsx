import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../config/api";
import { getCurrentAdminUser } from "../../services/adminService";

function ApproveUploads() {
	const [allNotes, setAllNotes] = useState([]); // Store all notes
	const [notes, setNotes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState("pending");
	const [selectedNote, setSelectedNote] = useState(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [selectedUserNotes, setSelectedUserNotes] = useState([]);
	const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
	const [bulkRejectionReason, setBulkRejectionReason] = useState("");
	const [stats, setStats] = useState({
		pending: 0,
		approved: 0,
		rejected: 0,
		total: 0,
	});
	const [deleteRequests, setDeleteRequests] = useState([]);
	const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
	const [deleteRequestReason, setDeleteRequestReason] = useState("");

	const current = getCurrentAdminUser();
	const role = current?.role || "moderator";
	const isAdmin = role === "admin";
	const isSenior = role === "senior moderator";
	const canDirectDelete = isAdmin || isSenior; // direct delete only for senior/admin

	// Filter notes function - defined before useEffect
	const filterNotes = useCallback(() => {
		console.log("🔍 Filtering notes - Current filter:", filter);
		console.log("📋 All notes available:", allNotes.length);
		console.log("📊 Notes by status:", {
			pending: allNotes.filter((note) => note.status === "pending").length,
			approved: allNotes.filter((note) => note.status === "approved").length,
			rejected: allNotes.filter((note) => note.status === "rejected").length,
		});

		if (filter === "all") {
			console.log("✅ Setting all notes:", allNotes.length);
			setNotes(allNotes);
		} else if (filter === "delete-requests") {
			// handled by separate view
			setNotes([]);
		} else {
			const filteredNotes = allNotes.filter((note) => note.status === filter);
			console.log(`✅ Setting ${filter} notes:`, filteredNotes.length);
			setNotes(filteredNotes);
		}
	}, [filter, allNotes]);

	// Fetch notes from the API
	useEffect(() => {
		fetchAllNotes();
		fetchStats();
		fetchDeleteRequests();
	}, []);

	// Filter notes locally when filter changes
	useEffect(() => {
		filterNotes();
	}, [filter, allNotes, filterNotes]);

	const fetchAllNotes = async () => {
		try {
			setLoading(true);
			setError(""); // Clear any previous errors
			const token = localStorage.getItem("adminToken");

			console.log(
				"🔍 Fetching notes with token:",
				token ? "Token exists" : "No token"
			);

			const response = await fetch(
				`${API_BASE_URL}/api/notes/admin/all?status=all&page=1&limit=100`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			console.log("📡 Response status:", response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("❌ Response error:", errorText);
				throw new Error(
					`Failed to fetch notes: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			console.log("📊 Fetched all notes data:", data);
			console.log("📋 Notes array:", data.data?.notes);
			console.log("📊 Total notes received:", data.data?.notes?.length || 0);

			const fetchedNotes = data.data?.notes || [];

			if (fetchedNotes.length === 0) {
				console.warn("⚠️ No notes received from API");
			}

			setAllNotes(fetchedNotes);
		} catch (err) {
			console.error("❌ Error fetching notes:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(`${API_BASE_URL}/api/notes/admin/stats`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				setStats(data.data.stats);
			}
		} catch (err) {
			console.error("Error fetching stats:", err);
		}
	};

	const fetchDeleteRequests = async () => {
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/delete-requests?status=pending`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			if (response.ok) {
				const data = await response.json();
				setDeleteRequests(data.data || []);
			}
		} catch (e) {
			console.error("Error fetching delete requests:", e);
		}
	};

	const approveNote = async (noteId) => {
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/${noteId}/approve`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: "Note approved by moderator",
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to approve note");
			}

			fetchAllNotes();
			fetchStats();
			alert("Note approved successfully!");
		} catch (err) {
			alert("Error approving note: " + err.message);
		}
	};

	const rejectNote = async () => {
		if (!selectedNote || !rejectionReason.trim()) {
			alert("Please provide a reason for rejection");
			return;
		}

		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/${selectedNote._id}/reject`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: rejectionReason.trim(),
					}),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to reject note");
			}

			setShowRejectModal(false);
			setSelectedNote(null);
			setRejectionReason("");
			fetchAllNotes();
			fetchStats();
			alert("Note rejected successfully!");
		} catch (err) {
			alert("Error rejecting note: " + err.message);
		}
	};

	// Bulk approve all notes from a user
	const bulkApproveUserNotes = async (userNotes) => {
		try {
			const token = localStorage.getItem("adminToken");
			const promises = userNotes.map((note) =>
				fetch(`${API_BASE_URL}/api/notes/${note._id}/approve`, {
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: "Bulk approved by moderator",
					}),
				})
			);

			const responses = await Promise.all(promises);
			const failedApprovals = responses.filter((response) => !response.ok);

			if (failedApprovals.length > 0) {
				throw new Error(`Failed to approve ${failedApprovals.length} notes`);
			}

			fetchAllNotes();
			fetchStats();
			alert(
				`Successfully approved ${userNotes.length} notes from ${userNotes[0].uploadedBy?.name}!`
			);
		} catch (err) {
			alert("Error bulk approving notes: " + err.message);
		}
	};

	// Bulk reject all notes from a user
	const bulkRejectUserNotes = async () => {
		if (!selectedUserNotes.length || !bulkRejectionReason.trim()) {
			alert("Please provide a reason for rejection");
			return;
		}

		try {
			const token = localStorage.getItem("adminToken");
			const promises = selectedUserNotes.map((note) =>
				fetch(`${API_BASE_URL}/api/notes/${note._id}/reject`, {
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: bulkRejectionReason.trim(),
					}),
				})
			);

			const responses = await Promise.all(promises);
			const failedRejections = responses.filter((response) => !response.ok);

			if (failedRejections.length > 0) {
				throw new Error(`Failed to reject ${failedRejections.length} notes`);
			}

			setShowBulkRejectModal(false);
			setSelectedUserNotes([]);
			setBulkRejectionReason("");
			fetchAllNotes();
			fetchStats();
			alert(
				`Successfully rejected ${selectedUserNotes.length} notes from ${selectedUserNotes[0].uploadedBy?.name}!`
			);
		} catch (err) {
			alert("Error bulk rejecting notes: " + err.message);
		}
	};

	// Bulk delete all notes from a user (only senior/admin)
	const bulkDeleteUserNotes = async (userNotes) => {
		if (!canDirectDelete) {
			alert(
				"Only admin/senior moderator can bulk delete. Moderators should request delete."
			);
			return;
		}
		const userName = userNotes[0]?.uploadedBy?.name || "Unknown User";

		if (
			!confirm(
				`Are you sure you want to permanently delete all ${userNotes.length} notes from ${userName}? This action cannot be undone and will remove all files from AWS and MongoDB.`
			)
		) {
			return;
		}

		try {
			const token = localStorage.getItem("adminToken");
			const promises = userNotes.map((note) =>
				fetch(`${API_BASE_URL}/api/notes/${note._id}`, {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				})
			);

			const responses = await Promise.all(promises);
			const failedDeletions = responses.filter((response) => !response.ok);

			if (failedDeletions.length > 0) {
				throw new Error(`Failed to delete ${failedDeletions.length} notes`);
			}

			fetchAllNotes();
			fetchStats();
			alert(`Successfully deleted ${userNotes.length} notes from ${userName}!`);
		} catch (err) {
			alert("Error bulk deleting notes: " + err.message);
		}
	};

	const downloadNote = async (noteId) => {
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/${noteId}/download`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error("Failed to get download link");
			}

			const data = await response.json();
			window.open(data.data.downloadUrl, "_blank");
		} catch (err) {
			alert("Error downloading note: " + err.message);
		}
	};

	const requestDeleteNote = async () => {
		if (!selectedNote) return;
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/delete-requests`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						noteId: selectedNote._id,
						reason: deleteRequestReason.trim(),
					}),
				}
			);
			if (!response.ok) {
				const e = await response.json().catch(() => ({}));
				throw new Error(e.message || "Failed to create delete request");
			}
			setShowDeleteRequestModal(false);
			setDeleteRequestReason("");
			setSelectedNote(null);
			await fetchDeleteRequests();
			alert("Delete request created");
		} catch (e) {
			alert(e.message);
		}
	};

	const approveDeleteRequest = async (requestId) => {
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/delete-requests/${requestId}/approve`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			if (!response.ok) throw new Error("Failed to approve request");
			await fetchAllNotes();
			await fetchDeleteRequests();
			alert("Request approved and note deleted");
		} catch (e) {
			alert(e.message);
		}
	};

	const rejectDeleteRequest = async (requestId) => {
		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(
				`${API_BASE_URL}/api/notes/delete-requests/${requestId}/reject`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ reason: "Not appropriate" }),
				}
			);
			if (!response.ok) throw new Error("Failed to reject request");
			await fetchDeleteRequests();
			alert("Request rejected");
		} catch (e) {
			alert(e.message);
		}
	};

	const deleteNote = async (noteId, noteTitle) => {
		if (!canDirectDelete) {
			// For moderators clicking delete on approved notes, show request modal
			const note = allNotes.find((n) => n._id === noteId);
			setSelectedNote(note || { _id: noteId, title: noteTitle });
			setShowDeleteRequestModal(true);
			return;
		}
		if (
			!confirm(
				`Are you sure you want to permanently delete "${noteTitle}"? This action cannot be undone and will remove the file from both AWS and MongoDB.`
			)
		) {
			return;
		}

		try {
			const token = localStorage.getItem("adminToken");
			const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const e = await response.json().catch(() => ({}));
				throw new Error(e.message || "Failed to delete note");
			}

			fetchAllNotes();
			fetchStats();
			alert("Note deleted successfully!");
		} catch (err) {
			alert("Error deleting note: " + err.message);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const getStatusBadge = (status) => {
		const badges = {
			pending: "bg-yellow-100 text-yellow-800",
			approved: "bg-green-100 text-green-800",
			rejected: "bg-red-100 text-red-800",
		};
		return badges[status] || "bg-gray-100 text-gray-800";
	};

	// Helper function to get the best display name for a note
	const getNoteDisplayName = (note) => {
		// Check if title looks corrupted (only numbers, very short, etc.)
		const title = note.title || "";
		const titleLooksCorrupted =
			/^\d+$/.test(title.trim()) || title.trim().length < 3 || !title.trim();

		// Use original filename if title looks corrupted
		if (titleLooksCorrupted && note.file?.originalName) {
			return note.file.originalName;
		}

		// Return title if it looks good
		return title || note.file?.originalName || "Unknown File";
	};

	// Helper function to calculate approval rate
	const getApprovalRate = (stats) => {
		if (!stats || stats.totalUploads === 0) return 0;
		return Math.round((stats.approvedCount / stats.totalUploads) * 100);
	};

	// Helper function to get approval rate color
	const getApprovalRateColor = (rate) => {
		if (rate >= 80) return "text-green-600 bg-green-100";
		if (rate >= 60) return "text-yellow-600 bg-yellow-100";
		if (rate >= 40) return "text-orange-600 bg-orange-100";
		return "text-red-600 bg-red-100";
	};

	// Group notes by user for pending status
	const groupNotesByUser = (notes) => {
		console.log("👥 Grouping notes by user:", notes);
		const grouped = {};
		notes.forEach((note) => {
			const userId = note.uploadedBy?._id || "unknown";
			if (!grouped[userId]) {
				grouped[userId] = {
					user: note.uploadedBy,
					notes: [],
				};
			}
			grouped[userId].notes.push(note);
		});
		const result = Object.values(grouped);
		console.log("👥 Grouped result with user stats:", result);
		return result;
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading notes...</p>
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
						Error Loading Notes
					</h3>
					<p className="text-red-600 mb-4">{error}</p>
					<button
						onClick={() => {
							setError("");
							fetchAllNotes();
						}}
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
			{/* Header with Stats */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					📋 Note Moderation
				</h2>

				{/* Stats Cards */}
				<div className="grid grid-cols-4 gap-4 mb-6">
					<div className="bg-yellow-50 p-4 rounded-lg">
						<h3 className="text-sm font-medium text-yellow-800">Pending</h3>
						<p className="text-2xl font-bold text-yellow-900">
							{stats.pending}
						</p>
					</div>
					<div className="bg-green-50 p-4 rounded-lg">
						<h3 className="text-sm font-medium text-green-800">Approved</h3>
						<p className="text-2xl font-bold text-green-900">
							{stats.approved}
						</p>
					</div>
					<div className="bg-red-50 p-4 rounded-lg">
						<h3 className="text-sm font-medium text-red-800">Rejected</h3>
						<p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
					</div>
					<div className="bg-blue-50 p-4 rounded-lg">
						<h3 className="text-sm font-medium text-blue-800">Total</h3>
						<p className="text-2xl font-bold text-blue-900">{stats.total}</p>
					</div>
				</div>

				{/* Filter Buttons */}
				<div className="flex space-x-2">
					{[
						"pending",
						"approved",
						"rejected",
						"all",
						...(isAdmin || isSenior ? ["delete-requests"] : []),
					].map((filterOption) => (
						<button
							key={filterOption}
							onClick={() => setFilter(filterOption)}
							className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition duration-200 ${
								filter === filterOption
									? "bg-teal-500 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							{filterOption.replace("-", " ")}
						</button>
					))}
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					Error: {error}
				</div>
			)}

			{/* Delete Requests List (for admins/seniors) */}
			{filter === "delete-requests" && (isAdmin || isSenior) && (
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Pending Delete Requests
						</h3>
						{deleteRequests.length === 0 ? (
							<div className="text-gray-500">No pending delete requests.</div>
						) : (
							<div className="space-y-4">
								{deleteRequests.map((req) => (
									<div
										key={req._id}
										className="border rounded p-4 flex items-start justify-between"
									>
										<div>
											<div className="font-medium text-gray-900">
												{getNoteDisplayName(req.note)}
											</div>
											<div className="text-sm text-gray-600">
												Requested by {req.requester?.name} •{" "}
												{formatDate(req.createdAt)}
											</div>
											{req.reason && (
												<div className="text-sm text-gray-500 mt-1">
													Reason: {req.reason}
												</div>
											)}
										</div>
										<div className="flex gap-2">
											<button
												onClick={() => approveDeleteRequest(req._id)}
												className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
											>
												Approve & Delete
											</button>
											<button
												onClick={() => rejectDeleteRequest(req._id)}
												className="px-3 py-1 text-red-700 bg-red-100 rounded hover:bg-red-200"
											>
												Reject
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Notes List */}
			{filter !== "delete-requests" && (
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					{notes.length === 0 ? (
						<div className="p-8 text-center text-gray-500">
							<div className="text-4xl mb-4">📭</div>
							<p className="text-lg mb-2">
								No notes found for the selected filter.
							</p>
							<div className="text-sm text-gray-400 mt-4">
								<p>
									Filter:{" "}
									<span className="font-mono bg-gray-100 px-2 py-1 rounded">
										{filter}
									</span>
								</p>
								<p>
									Total notes loaded:{" "}
									<span className="font-mono bg-gray-100 px-2 py-1 rounded">
										{allNotes.length}
									</span>
								</p>
								<p>
									Available statuses:{" "}
									{[...new Set(allNotes.map((note) => note.status))].join(
										", "
									) || "None"}
								</p>
							</div>
							<button
								onClick={fetchAllNotes}
								className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-200"
							>
								🔄 Refresh Data
							</button>
						</div>
					) : filter === "pending" ? (
						<div className="p-6">
							<h3 className="text-lg font-semibold text-gray-800 mb-4">
								Pending Uploads by User
							</h3>
							<div className="space-y-6">
								{groupNotesByUser(notes).map((userGroup, index) => (
									<div
										key={index}
										className="border border-gray-200 rounded-lg p-6 bg-gray-50"
									>
										<div className="flex justify-between items-start mb-4">
											{/* Left: User details */}
											<div className="flex items-center space-x-4">
												<div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
													{userGroup.user?.name?.charAt(0)?.toUpperCase() ||
														"?"}
												</div>
												<div className="flex-1">
													<div className="flex items-center space-x-3 mb-2">
														<h4 className="text-xl font-semibold text-gray-900">
															{userGroup.user?.name || "Unknown User"}
														</h4>
														<span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
															User
														</span>
													</div>
													<p className="text-sm text-gray-600 mb-3">
														📧 {userGroup.user?.email || "No email"}
													</p>
													<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
														<div className="bg-white p-3 rounded-lg border">
															<div className="text-xs text-gray-500 mb-1">
																Member Since
															</div>
															<div className="text-sm font-semibold text-gray-900">
																{userGroup.user?.createdAt
																	? new Date(
																			userGroup.user.createdAt
																	  ).toLocaleDateString("en-US", {
																			month: "short",
																			year: "numeric",
																	  })
																	: "Unknown"}
															</div>
														</div>
														{userGroup.user?.stats ? (
															<>
																<div className="bg-white p-3 rounded-lg border">
																	<div className="text-xs text-gray-500 mb-1">
																		Total Uploads
																	</div>
																	<div className="text-sm font-semibold text-blue-600">
																		📊 {userGroup.user.stats.totalUploads}
																	</div>
																</div>
																<div className="bg-white p-3 rounded-lg border">
																	<div className="text-xs text-gray-500 mb-1">
																		Approved
																	</div>
																	<div className="text-sm font-semibold text-green-600">
																		✅ {userGroup.user.stats.approvedCount}
																	</div>
																</div>
																<div className="bg-white p-3 rounded-lg border">
																	<div className="text-xs text-gray-500 mb-1">
																		Rejected
																	</div>
																	<div className="text-sm font-semibold text-red-600">
																		❌ {userGroup.user.stats.rejectedCount}
																	</div>
																</div>
																<div className="bg-white p-3 rounded-lg border">
																	<div className="text-xs text-gray-500 mb-1">
																		Success Rate
																	</div>
																	<div
																		className={`text-sm font-semibold px-2 py-1 rounded ${getApprovalRateColor(
																			getApprovalRate(userGroup.user.stats)
																		)}`}
																	>
																		🎯 {getApprovalRate(userGroup.user.stats)}%
																	</div>
																</div>
															</>
														) : (
															<div className="col-span-4 bg-white p-3 rounded-lg border">
																<div className="text-xs text-gray-500">
																	Statistics not available - User data:{" "}
																	{JSON.stringify(userGroup.user, null, 2)}
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
											{/* Right: Bulk Actions */}
											<div className="flex flex-col space-y-2">
												<div className="flex space-x-2 flex-wrap gap-2">
													<button
														onClick={() =>
															bulkApproveUserNotes(userGroup.notes)
														}
														className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
													>
														✅ Approve All ({userGroup.notes.length})
													</button>
													<button
														onClick={() => {
															setSelectedUserNotes(userGroup.notes);
															setShowBulkRejectModal(true);
														}}
														className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
													>
														❌ Reject All
													</button>
													{canDirectDelete ? (
														<button
															onClick={() =>
																bulkDeleteUserNotes(userGroup.notes)
															}
															className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 text-sm font-medium transition-colors"
															title="Permanently delete all notes from this user (removes from AWS and database)"
														>
															🗑️ Delete All
														</button>
													) : null}
												</div>
												<div className="text-xs text-gray-500 text-right">
													{userGroup.notes.length} pending file
													{userGroup.notes.length !== 1 ? "s" : ""}
												</div>
											</div>
										</div>
										{/* Files List */}
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
											{userGroup.notes.map((note) => (
												<div
													key={note._id}
													className="bg-white border border-gray-200 rounded-lg p-4"
												>
													<div className="flex justify-between items-start mb-2">
														<h5 className="font-medium text-gray-900 text-sm truncate">
															{getNoteDisplayName(note)}
														</h5>
														<span
															className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(
																note.status
															)}`}
														>
															{note.status}
														</span>
													</div>
													<div className="text-xs text-gray-500 space-y-1">
														<div>
															📚 {note.college?.toUpperCase()} - {note.course}
														</div>
														<div>
															📄 Sem {note.semester} - {note.subject}
														</div>
														<div>📁 {note.uploadType}</div>
														<div>💾 {formatFileSize(note.file?.size || 0)}</div>
														<div>📅 {formatDate(note.createdAt)}</div>
													</div>
													<div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
														<button
															onClick={() => downloadNote(note._id)}
															className="text-blue-600 hover:text-blue-800 text-xs"
														>
															📥 Download
														</button>
														<div className="flex space-x-2">
															<button
																onClick={() => approveNote(note._id)}
																className="text-green-600 hover:text-green-800 text-xs"
															>
																✅ Approve
															</button>
															<button
																onClick={() => {
																	setSelectedNote(note);
																	setShowRejectModal(true);
																}}
																className="text-red-600 hover:text-red-800 text-xs"
															>
																❌ Reject
															</button>
															{canDirectDelete ? (
																<button
																	onClick={() =>
																		deleteNote(
																			note._id,
																			getNoteDisplayName(note)
																		)
																	}
																	className="text-red-800 hover:text-red-900 text-xs font-bold"
																	title="Permanently delete this note (removes from AWS and database)"
																>
																	🗑️ Delete
																</button>
															) : (
																<button
																	onClick={() => {
																		setSelectedNote(note);
																		setShowDeleteRequestModal(true);
																	}}
																	className="text-orange-700 hover:text-orange-800 text-xs font-semibold"
																	title="Request deletion (requires senior/admin approval)"
																>
																	📝 Request Delete
																</button>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
											Note Details
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
											Course Info
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
											File Info
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{notes.map((note) => (
										<tr key={note._id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div>
													<div className="text-sm font-medium text-gray-900">
														{getNoteDisplayName(note)}
													</div>
													<div className="flex items-center space-x-2 mt-1">
														<div className="text-sm text-gray-600">
															👤 {note.uploadedBy?.name || "Unknown"}
														</div>
														{note.uploadedBy?.stats && (
															<div className="flex items-center space-x-2">
																<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
																	📊 {note.uploadedBy.stats.totalUploads} total
																</span>
																<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
																	✅ {note.uploadedBy.stats.approvedCount}
																</span>
																<span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
																	❌ {note.uploadedBy.stats.rejectedCount}
																</span>
																<span
																	className={`text-xs px-2 py-1 rounded ${getApprovalRateColor(
																		getApprovalRate(note.uploadedBy.stats)
																	)}`}
																>
																	🎯 {getApprovalRate(note.uploadedBy.stats)}%
																</span>
															</div>
														)}
													</div>
													<div className="flex items-center space-x-3 mt-2">
														<div className="text-xs text-gray-500">
															📅 Uploaded: {formatDate(note.createdAt)}
														</div>
														{note.uploadedBy?.createdAt && (
															<div className="text-xs text-gray-500">
																🎯 Member since:{" "}
																{new Date(
																	note.uploadedBy.createdAt
																).toLocaleDateString("en-US", {
																	month: "short",
																	year: "numeric",
																})}
															</div>
														)}
													</div>
													{note.description && (
														<div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
															{note.description}
														</div>
													)}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm">
													<div className="font-medium text-gray-900">
														{note.college?.toUpperCase()}
													</div>
													<div className="text-gray-500">{note.course}</div>
													{note.subcourse && (
														<div className="text-gray-500">
															{note.subcourse}
														</div>
													)}
													<div className="text-gray-500">
														Sem {note.semester}
													</div>
													<div className="text-gray-500">{note.subject}</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm">
													<div className="font-medium text-gray-900">
														{note.title || "N/A"}
													</div>
													<div className="text-gray-500">
														{formatFileSize(note.file?.size || 0)}
													</div>
													<div className="text-gray-500">{note.uploadType}</div>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
														note.status
													)}`}
												>
													{note.status}
												</span>
												{note.status === "approved" && note.approvedBy && (
													<div className="text-xs text-gray-500 mt-1">
														by {note.approvedBy.name}
													</div>
												)}
												{note.status === "rejected" && note.rejectedBy && (
													<div className="text-xs text-gray-500 mt-1">
														by {note.rejectedBy.name}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												<div className="flex items-center space-x-3">
													<button
														onClick={() => downloadNote(note._id)}
														className="text-blue-600 hover:text-blue-900 flex items-center"
													>
														📥 Download
													</button>

													{note.status === "pending" && (
														<>
															<button
																onClick={() => approveNote(note._id)}
																className="text-green-600 hover:text-green-900 flex items-center"
															>
																✅ Approve
															</button>
															<button
																onClick={() => {
																	setSelectedNote(note);
																	setShowRejectModal(true);
																}}
																className="text-red-600 hover:text-red-900 flex items-center"
															>
																❌ Reject
															</button>
														</>
													)}

													{canDirectDelete ? (
														<button
															onClick={() =>
																deleteNote(note._id, getNoteDisplayName(note))
															}
															className="text-red-800 hover:text-red-900 flex items-center font-bold"
															title="Permanently delete this note (removes from AWS and database)"
														>
															🗑️ Delete
														</button>
													) : (
														<button
															onClick={() => {
																setSelectedNote(note);
																setShowDeleteRequestModal(true);
															}}
															className="text-orange-700 hover:text-orange-800 flex items-center font-semibold"
															title="Request deletion (requires senior/admin approval)"
														>
															📝 Request Delete
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}

			{/* Individual Reject Modal */}
			{showRejectModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
						<div className="mt-3">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Reject Note: {selectedNote?.title}
							</h3>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Reason for rejection <span className="text-red-500">*</span>
								</label>
								<textarea
									value={rejectionReason}
									onChange={(e) => setRejectionReason(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
									rows="4"
									placeholder="Please provide a clear reason for rejecting this note..."
									required
								/>
							</div>
							<div className="flex justify-end space-x-3">
								<button
									onClick={() => {
										setShowRejectModal(false);
										setSelectedNote(null);
										setRejectionReason("");
									}}
									className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
								>
									Cancel
								</button>
								<button
									onClick={rejectNote}
									className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
								>
									Reject Note
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Bulk Reject Modal */}
			{showBulkRejectModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
						<div className="mt-3">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Bulk Reject Notes from: {selectedUserNotes[0]?.uploadedBy?.name}
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								You are about to reject {selectedUserNotes.length} notes from
								this user.
							</p>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Reason for rejection <span className="text-red-500">*</span>
								</label>
								<textarea
									value={bulkRejectionReason}
									onChange={(e) => setBulkRejectionReason(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
									rows="4"
									placeholder="Please provide a clear reason for rejecting these notes..."
									required
								/>
							</div>
							<div className="flex justify-end space-x-3">
								<button
									onClick={() => {
										setShowBulkRejectModal(false);
										setSelectedUserNotes([]);
										setBulkRejectionReason("");
									}}
									className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
								>
									Cancel
								</button>
								<button
									onClick={bulkRejectUserNotes}
									className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
								>
									Reject All {selectedUserNotes.length} Notes
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Request Delete Modal */}
			{showDeleteRequestModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
					<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
						<div className="mt-3">
							<h3 className="text-lg font-medium text-gray-900 mb-4">
								Request Delete:{" "}
								{selectedNote ? getNoteDisplayName(selectedNote) : "Note"}
							</h3>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Reason (optional)
								</label>
								<textarea
									value={deleteRequestReason}
									onChange={(e) => setDeleteRequestReason(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
									rows="3"
									placeholder="Explain why this note should be deleted (spam, copyright, wrong content, etc.)"
								/>
							</div>
							<div className="flex justify-end space-x-3">
								<button
									onClick={() => {
										setShowDeleteRequestModal(false);
										setDeleteRequestReason("");
										setSelectedNote(null);
									}}
									className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
								>
									Cancel
								</button>
								<button
									onClick={requestDeleteNote}
									className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
								>
									Submit Request
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default ApproveUploads;
