import React, { useEffect, useState } from "react";
import {
	fetchModerators as apiFetchModerators,
	fetchUsers as apiFetchUsers,
	updateUserRole as apiUpdateUserRole,
	updateUserStatus as apiUpdateUserStatus,
} from "../../services/adminService";
import { getCurrentAdminUser } from "../../services/adminService";

const ROLE_LEVEL = { user: 0, moderator: 1, "senior moderator": 2, admin: 3 };

function ManageModerators() {
	const [moderators, setModerators] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [showAddModal, setShowAddModal] = useState(false);
	const [newModerator, setNewModerator] = useState({
		email: "",
		role: "moderator",
	});

	const [updatingId, setUpdatingId] = useState(null);

	// Acting user role
	const actingRole = getCurrentAdminUser()?.role || "user";
	const actingLevel = ROLE_LEVEL[actingRole] ?? 0;

	const loadModerators = async () => {
		try {
			setLoading(true);
			setError("");
			const res = await apiFetchModerators();
			const users = res.data?.users || [];

			const toDateString = (value) => {
				if (!value) return "-";
				const d = new Date(value);
				return isNaN(d.getTime()) ? "-" : d.toISOString().split("T")[0];
			};

			setModerators(
				users.map((u) => ({
					id: u._id,
					name: u.name,
					email: u.email,
					role: u.role,
					// Treat undefined as active to avoid mass-inactive for legacy users
					status: u.isActive === false ? "Inactive" : "Active",
					joinDate: toDateString(u.createdAt),
					approvedUploads: u.approvedUploads || 0,
					totalUploads: u.totalUploads || 0,
					rejectedUploads: u.rejectedUploads || 0,
				}))
			);
		} catch (e) {
			console.error(e);
			setError(e.message || "Failed to load moderators");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadModerators();
	}, []);

	const canModifyTarget = (targetRole) => {
		const targetLevel = ROLE_LEVEL[targetRole] ?? 0;
		return actingLevel > targetLevel; // must be strictly higher
	};

	const canAssignRole = (newRole) => (ROLE_LEVEL[newRole] ?? 0) <= actingLevel;

	const handleRoleChange = async (userId, nextRole, targetRoleForCheck) => {
		if (!canAssignRole(nextRole) || !canModifyTarget(targetRoleForCheck)) {
			alert(
				"You cannot modify users with equal/higher role or assign higher role."
			);
			return;
		}
		try {
			setUpdatingId(userId);
			await apiUpdateUserRole(userId, nextRole);
			await loadModerators();
		} catch (e) {
			alert(e.message || "Failed to update role");
		} finally {
			setUpdatingId(null);
		}
	};

	const handleToggleActive = async (userId, isActive, targetRoleForCheck) => {
		if (!canModifyTarget(targetRoleForCheck)) {
			alert("You cannot modify users with equal or higher role.");
			return;
		}
		try {
			setUpdatingId(userId);
			await apiUpdateUserStatus(userId, !isActive);
			await loadModerators();
		} catch (e) {
			alert(e.message || "Failed to update status");
		} finally {
			setUpdatingId(null);
		}
	};

	const handleRemoveModerator = async (userId, targetRoleForCheck) => {
		if (!canModifyTarget(targetRoleForCheck)) {
			alert("You cannot modify users with equal or higher role.");
			return;
		}
		if (!confirm("Remove moderator role for this user?")) return;
		await handleRoleChange(userId, "user", targetRoleForCheck);
	};

	const handleAddModerator = async (e) => {
		e.preventDefault();
		if (!canAssignRole(newModerator.role)) {
			alert("You cannot assign a role higher than your own.");
			return;
		}
		try {
			setUpdatingId("new");
			// Find user by email
			const usersRes = await apiFetchUsers();
			const users = usersRes.data?.users || [];
			const user = users.find(
				(u) =>
					u.email?.toLowerCase() === newModerator.email.trim().toLowerCase()
			);
			if (!user) {
				throw new Error(
					"User not found. Ask the person to sign up first, then add them."
				);
			}

			await apiUpdateUserRole(user._id, newModerator.role);
			await loadModerators();
			setNewModerator({ email: "", role: "moderator" });
			setShowAddModal(false);
		} catch (e) {
			alert(e.message || "Failed to add moderator");
		} finally {
			setUpdatingId(null);
		}
	};

	const activeCount = moderators.filter((m) => m.status === "Active").length;
	const totalApprovals = moderators.reduce(
		(sum, m) => sum + (m.approvedUploads || 0),
		0
	);
	const averageApprovals = moderators.length
		? Math.round(totalApprovals / moderators.length)
		: 0;

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading moderators...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-800">
					🧑‍💼 Manage Moderators
				</h2>
				<button
					onClick={() => setShowAddModal(true)}
					className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
				>
					+ Add Moderator
				</button>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{error}
				</div>
			)}

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
					<h3 className="text-lg font-semibold text-green-700">
						Active Moderators
					</h3>
					<p className="text-2xl font-bold text-green-800">{activeCount}</p>
				</div>
				<div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
					<h3 className="text-lg font-semibold text-orange-700">
						Total Approvals
					</h3>
					<p className="text-2xl font-bold text-orange-800">{totalApprovals}</p>
				</div>
				<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
					<h3 className="text-lg font-semibold text-blue-700">
						Average Approvals
					</h3>
					<p className="text-2xl font-bold text-blue-800">{averageApprovals}</p>
				</div>
			</div>

			{/* Moderators Table */}
			<div className="overflow-x-auto">
				<table className="w-full table-auto">
					<thead>
						<tr className="bg-gray-50">
							<th className="px-4 py-3 text-left">Name</th>
							<th className="px-4 py-3 text-left">Email</th>
							<th className="px-4 py-3 text-left">Role</th>
							<th className="px-4 py-3 text-left">Status</th>
							<th className="px-4 py-3 text-left">Join Date</th>
							<th className="px-4 py-3 text-left">Approved Uploads</th>
							<th className="px-4 py-3 text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{moderators.map((m) => {
							const isActive = m.status === "Active";
							const targetLevel = ROLE_LEVEL[m.role] ?? 0;
							const canModify = actingLevel > targetLevel;
							return (
								<tr key={m.id} className="border-b hover:bg-gray-50">
									<td className="px-4 py-3 font-medium">{m.name}</td>
									<td className="px-4 py-3">{m.email}</td>
									<td className="px-4 py-3">
										<span
											className={`px-2 py-1 rounded-full text-sm ${
												m.role === "senior moderator"
													? "bg-purple-100 text-purple-800"
													: m.role === "admin"
													? "bg-red-100 text-red-800"
													: "bg-blue-100 text-blue-800"
											}`}
										>
											{m.role}
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
									<td className="px-4 py-3">{m.joinDate}</td>
									<td className="px-4 py-3 text-center font-semibold">
										{m.approvedUploads}
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-2">
											<button
												onClick={() =>
													handleRoleChange(m.id, "senior moderator", m.role)
												}
												className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
												disabled={
													updatingId === m.id ||
													!canModify ||
													!canAssignRole("senior moderator")
												}
											>
												Promote
											</button>
											{canAssignRole("admin") && canModify && (
												<button
													onClick={() =>
														handleRoleChange(m.id, "admin", m.role)
													}
													className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
													disabled={updatingId === m.id}
												>
													Make Admin
												</button>
											)}
											<button
												onClick={() =>
													handleRoleChange(m.id, "moderator", m.role)
												}
												className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
												disabled={updatingId === m.id || !canModify}
											>
												Demote
											</button>
											<button
												onClick={() =>
													handleToggleActive(m.id, isActive, m.role)
												}
												className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
												disabled={updatingId === m.id || !canModify}
											>
												{isActive ? "Deactivate" : "Activate"}
											</button>
											<button
												onClick={() => handleRemoveModerator(m.id, m.role)}
												className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
												disabled={updatingId === m.id || !canModify}
											>
												Remove
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Add Moderator Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
						<h3 className="text-xl font-bold mb-4">Add New Moderator</h3>
						<form onSubmit={handleAddModerator} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									User Email
								</label>
								<input
									type="email"
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={newModerator.email}
									onChange={(e) =>
										setNewModerator({ ...newModerator, email: e.target.value })
									}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Role
								</label>
								<select
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={newModerator.role}
									onChange={(e) =>
										setNewModerator({ ...newModerator, role: e.target.value })
									}
								>
									<option value="moderator">Moderator</option>
									<option value="senior moderator">Senior Moderator</option>
								</select>
							</div>
							<div className="flex space-x-3 pt-4">
								<button
									type="submit"
									className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition-colors disabled:opacity-50"
									disabled={
										updatingId === "new" || !canAssignRole(newModerator.role)
									}
								>
									Add Moderator
								</button>
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default ManageModerators;
