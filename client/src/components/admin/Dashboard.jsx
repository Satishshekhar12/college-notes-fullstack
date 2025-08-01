import React from "react";

function Dashboard() {
	const notifications = [
		{
			id: 1,
			type: "upload",
			message: "You have 5 uploads to approve",
			count: 5,
			icon: "📁",
			color: "bg-orange-50 border-orange-200 text-orange-800",
		},
		{
			id: 2,
			type: "moderator",
			message: "Moderator John submitted 3 files",
			count: 3,
			icon: "👤",
			color: "bg-blue-50 border-blue-200 text-blue-800",
		},
		{
			id: 3,
			type: "request",
			message: "New moderator requests pending",
			count: 2,
			icon: "👥",
			color: "bg-purple-50 border-purple-200 text-purple-800",
		},
	];

	return (
		<div className="space-y-6">
			{/* Notifications Section */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
					🔔 Notifications
				</h2>
				<div className="space-y-3">
					{notifications.map((notification) => (
						<div
							key={notification.id}
							className={`p-4 rounded-lg border-l-4 ${notification.color}`}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<span className="text-lg">{notification.icon}</span>
									<span className="font-medium">{notification.message}</span>
								</div>
								<span className="font-bold text-lg">{notification.count}</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Dashboard Stats */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
						<h3 className="text-lg font-semibold text-blue-700">Total Users</h3>
						<p className="text-2xl font-bold text-blue-800">1,234</p>
					</div>
					<div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
						<h3 className="text-lg font-semibold text-green-700">
							Pending Uploads
						</h3>
						<p className="text-2xl font-bold text-green-800">56</p>
					</div>
					<div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
						<h3 className="text-lg font-semibold text-yellow-700">
							Moderator Requests
						</h3>
						<p className="text-2xl font-bold text-yellow-800">23</p>
					</div>
					<div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
						<h3 className="text-lg font-semibold text-purple-700">
							Active Moderators
						</h3>
						<p className="text-2xl font-bold text-purple-800">12</p>
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
						<div className="text-sm opacity-90">5 pending approvals</div>
					</button>
					<button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors">
						<div className="text-lg font-semibold">Manage Moderators</div>
						<div className="text-sm opacity-90">12 active moderators</div>
					</button>
					<button className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors">
						<div className="text-lg font-semibold">User Requests</div>
						<div className="text-sm opacity-90">2 new requests</div>
					</button>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
