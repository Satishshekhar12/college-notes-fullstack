import React, { useEffect, useState } from "react";
import {
	getDashboardStats,
	getCurrentAdminUser,
} from "../../services/adminService";

function Dashboard() {
	const [stats, setStats] = useState({
		totalUsers: 0,
		pendingUploads: 0,
		pendingModeratorRequests: 0,
		activeModerators: 0,
	});
	const [error, setError] = useState("");
	const current = getCurrentAdminUser();
	const role = current?.role || "moderator";

	useEffect(() => {
		const load = async () => {
			try {
				const res = await getDashboardStats();
				const d = res.data || {};
				setStats({
					totalUsers: d.totalUsers || 0,
					pendingUploads: d.pendingUploads || 0,
					pendingModeratorRequests: d.pendingModeratorRequests || 0,
					activeModerators: d.activeModerators || 0,
				});
			} catch (e) {
				setError(e.message || "Failed to load stats");
			}
		};
		load();
	}, []);

	const isAdmin = role === "admin";
	const isSenior = role === "senior moderator";

	return (
		<div className="space-y-6">
			{/* Role Banner */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h2>
				<p className="text-gray-700">
					Your Role: <span className="font-semibold capitalize">{role}</span>
				</p>
			</div>

			{/* Notifications Section */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
					🔔 Notifications
				</h2>
				<div className="space-y-3">
					<div
						className={`p-4 rounded-lg border-l-4 bg-orange-50 border-orange-200 text-orange-800`}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<span className="text-lg">📁</span>
								<span className="font-medium">Uploads to review</span>
							</div>
							<span className="font-bold text-lg">{stats.pendingUploads}</span>
						</div>
					</div>
					{isAdmin && (
						<div
							className={`p-4 rounded-lg border-l-4 bg-purple-50 border-purple-200 text-purple-800`}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<span className="text-lg">👥</span>
									<span className="font-medium">New moderator requests</span>
								</div>
								<span className="font-bold text-lg">
									{stats.pendingModeratorRequests}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Dashboard Stats */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard</h2>
				{error && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						{error}
					</div>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
						<h3 className="text-lg font-semibold text-blue-700">Total Users</h3>
						<p className="text-2xl font-bold text-blue-800">
							{stats.totalUsers}
						</p>
					</div>
					<div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
						<h3 className="text-lg font-semibold text-green-700">
							Pending Uploads
						</h3>
						<p className="text-2xl font-bold text-green-800">
							{stats.pendingUploads}
						</p>
					</div>
					{isAdmin && (
						<div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
							<h3 className="text-lg font-semibold text-yellow-700">
								Moderator Requests
							</h3>
							<p className="text-2xl font-bold text-yellow-800">
								{stats.pendingModeratorRequests}
							</p>
						</div>
					)}
					<div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
						<h3 className="text-lg font-semibold text-purple-700">
							Active Moderators
						</h3>
						<p className="text-2xl font-bold text-purple-800">
							{stats.activeModerators}
						</p>
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">
					⚡ Quick Actions
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<button className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors">
						<div className="text-lg font-semibold">Review Uploads</div>
						<div className="text-sm opacity-90">
							{stats.pendingUploads} pending approvals
						</div>
					</button>
					{isAdmin || isSenior ? (
						<button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors">
							<div className="text-lg font-semibold">Manage Moderators</div>
							<div className="text-sm opacity-90">
								{stats.activeModerators} active moderators
							</div>
						</button>
					) : (
						<button
							className="bg-blue-300 text-white p-4 rounded-lg cursor-not-allowed"
							disabled
						>
							<div className="text-lg font-semibold">Manage Moderators</div>
							<div className="text-sm opacity-90">Admins/Seniors only</div>
						</button>
					)}
					{isAdmin ? (
						<button className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors">
							<div className="text-lg font-semibold">User Requests</div>
							<div className="text-sm opacity-90">
								{stats.pendingModeratorRequests} new requests
							</div>
						</button>
					) : (
						<button
							className="bg-purple-300 text-white p-4 rounded-lg cursor-not-allowed"
							disabled
						>
							<div className="text-lg font-semibold">User Requests</div>
							<div className="text-sm opacity-90">Admins only</div>
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
