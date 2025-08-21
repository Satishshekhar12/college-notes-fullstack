import React from "react";

function AdminSidebar({ activeSection, setActiveSection, handleLogout }) {
	const sidebarItems = [
		{ id: "dashboard", icon: "🏠", label: "Dashboard" },
		{ id: "moderators", icon: "🧑‍💼", label: "Manage Moderators (owner page)" },
		{ id: "uploads", icon: "✅", label: "Approve Uploads" },
		{ id: "requests", icon: "👥", label: "User Requests" },
		{ id: "settings", icon: "⚙️", label: "Settings " },
	];

	return (
		<div className="w-80 bg-white shadow-lg h-screen fixed left-0 top-20 overflow-y-auto">
			<div className="p-6 border-b border-gray-200">
				<h2 className="text-xl font-bold text-gray-800 flex items-center">
					🧭 Admin Sidebar
				</h2>
			</div>
			<nav className="p-4">
				<ul className="space-y-2">
					{sidebarItems.map((item) => (
						<li key={item.id}>
							<button
								onClick={() => setActiveSection(item.id)}
								className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
									activeSection === item.id
										? "bg-teal-100 text-teal-700 border-l-4 border-teal-500"
										: "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
								}`}
							>
								<span className="text-lg">{item.icon}</span>
								<span className="font-medium">{item.label}</span>
							</button>
						</li>
					))}
					<li className="pt-4 border-t border-gray-200">
						<button
							onClick={handleLogout}
							className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 text-red-600 hover:bg-red-50 hover:text-red-700"
						>
							<span className="text-lg">🚪</span>
							<span className="font-medium">Logout</span>
						</button>
					</li>
				</ul>
			</nav>
		</div>
	);
}

export default AdminSidebar;
