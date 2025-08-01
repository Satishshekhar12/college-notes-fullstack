import React, { useState } from "react";

function ManageModerators() {
	const [moderators, setModerators] = useState([
		{
			id: 1,
			name: "John Doe",
			email: "john@example.com",
			role: "Moderator",
			status: "Active",
			joinDate: "2024-01-15",
			approvedUploads: 45,
		},
		{
			id: 2,
			name: "Jane Smith",
			email: "jane@example.com",
			role: "Senior Moderator",
			status: "Active",
			joinDate: "2023-11-20",
			approvedUploads: 128,
		},
		{
			id: 3,
			name: "Mike Johnson",
			email: "mike@example.com",
			role: "Moderator",
			status: "Inactive",
			joinDate: "2024-03-10",
			approvedUploads: 12,
		},
	]);

	const [showAddModal, setShowAddModal] = useState(false);
	const [newModerator, setNewModerator] = useState({
		name: "",
		email: "",
		role: "Moderator",
	});

	const handleRemoveModerator = (id) => {
		if (window.confirm("Are you sure you want to remove this moderator?")) {
			setModerators(moderators.filter((mod) => mod.id !== id));
		}
	};

	const handleAddModerator = (e) => {
		e.preventDefault();
		const newId = Math.max(...moderators.map((m) => m.id)) + 1;
		setModerators([
			...moderators,
			{
				...newModerator,
				id: newId,
				status: "Active",
				joinDate: new Date().toISOString().split("T")[0],
				approvedUploads: 0,
			},
		]);
		setNewModerator({ name: "", email: "", role: "Moderator" });
		setShowAddModal(false);
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-gray-800">
					🧑‍💼 Manage Moderators (Owner Only)
				</h2>
				<button
					onClick={() => setShowAddModal(true)}
					className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
				>
					+ Add Moderator
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
					<h3 className="text-lg font-semibold text-green-700">
						Active Moderators
					</h3>
					<p className="text-2xl font-bold text-green-800">
						{moderators.filter((m) => m.status === "Active").length}
					</p>
				</div>
				<div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
					<h3 className="text-lg font-semibold text-orange-700">
						Total Approvals
					</h3>
					<p className="text-2xl font-bold text-orange-800">
						{moderators.reduce((sum, m) => sum + m.approvedUploads, 0)}
					</p>
				</div>
				<div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
					<h3 className="text-lg font-semibold text-blue-700">
						Average Approvals
					</h3>
					<p className="text-2xl font-bold text-blue-800">
						{Math.round(
							moderators.reduce((sum, m) => sum + m.approvedUploads, 0) /
								moderators.length
						)}
					</p>
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
						{moderators.map((moderator) => (
							<tr key={moderator.id} className="border-b hover:bg-gray-50">
								<td className="px-4 py-3 font-medium">{moderator.name}</td>
								<td className="px-4 py-3">{moderator.email}</td>
								<td className="px-4 py-3">
									<span
										className={`px-2 py-1 rounded-full text-sm ${
											moderator.role === "Senior Moderator"
												? "bg-purple-100 text-purple-800"
												: "bg-blue-100 text-blue-800"
										}`}
									>
										{moderator.role}
									</span>
								</td>
								<td className="px-4 py-3">
									<span
										className={`px-2 py-1 rounded-full text-sm ${
											moderator.status === "Active"
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{moderator.status}
									</span>
								</td>
								<td className="px-4 py-3">{moderator.joinDate}</td>
								<td className="px-4 py-3 text-center font-semibold">
									{moderator.approvedUploads}
								</td>
								<td className="px-4 py-3">
									<div className="flex space-x-2">
										<button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
											Edit
										</button>
										<button
											onClick={() => handleRemoveModerator(moderator.id)}
											className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
										>
											Remove
										</button>
									</div>
								</td>
							</tr>
						))}
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
									Name
								</label>
								<input
									type="text"
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={newModerator.name}
									onChange={(e) =>
										setNewModerator({ ...newModerator, name: e.target.value })
									}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Email
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
									<option value="Moderator">Moderator</option>
									<option value="Senior Moderator">Senior Moderator</option>
								</select>
							</div>
							<div className="flex space-x-3 pt-4">
								<button
									type="submit"
									className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition-colors"
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
