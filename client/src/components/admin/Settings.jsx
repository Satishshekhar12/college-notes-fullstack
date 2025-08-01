import React, { useState } from "react";

function Settings() {
	const [settings, setSettings] = useState({
		siteName: "College Notes",
		siteDescription: "A platform for sharing educational resources",
		maxUploadSize: 10,
		allowedFileTypes: ["pdf", "doc", "docx", "ppt", "pptx"],
		autoApproval: false,
		emailNotifications: true,
		maintenanceMode: false,
		registrationOpen: true,
		moderatorAutoApproval: false,
	});

	const [unsavedChanges, setUnsavedChanges] = useState(false);

	const handleInputChange = (field, value) => {
		setSettings({ ...settings, [field]: value });
		setUnsavedChanges(true);
	};

	const handleSaveSettings = () => {
		// TODO: Implement actual save functionality
		console.log("Saving settings:", settings);
		setUnsavedChanges(false);
		alert("Settings saved successfully!");
	};

	const handleResetSettings = () => {
		if (
			window.confirm(
				"Are you sure you want to reset all settings to default values?"
			)
		) {
			setSettings({
				siteName: "College Notes",
				siteDescription: "A platform for sharing educational resources",
				maxUploadSize: 10,
				allowedFileTypes: ["pdf", "doc", "docx", "ppt", "pptx"],
				autoApproval: false,
				emailNotifications: true,
				maintenanceMode: false,
				registrationOpen: true,
				moderatorAutoApproval: false,
			});
			setUnsavedChanges(true);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-2xl font-bold text-gray-800 mb-2">⚙️ Settings</h2>
				<p className="text-gray-600">
					Configure your college notes platform settings
				</p>
				{unsavedChanges && (
					<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<p className="text-yellow-800 text-sm">
							⚠️ You have unsaved changes. Remember to save your settings.
						</p>
					</div>
				)}
			</div>

			{/* General Settings */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					General Settings
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Site Name
						</label>
						<input
							type="text"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							value={settings.siteName}
							onChange={(e) => handleInputChange("siteName", e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Maximum Upload Size (MB)
						</label>
						<input
							type="number"
							min="1"
							max="100"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							value={settings.maxUploadSize}
							onChange={(e) =>
								handleInputChange("maxUploadSize", parseInt(e.target.value))
							}
						/>
					</div>
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Site Description
						</label>
						<textarea
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							rows="3"
							value={settings.siteDescription}
							onChange={(e) =>
								handleInputChange("siteDescription", e.target.value)
							}
						/>
					</div>
				</div>
			</div>

			{/* Upload Settings */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					Upload Settings
				</h3>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Allowed File Types
						</label>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
							{["pdf", "doc", "docx", "ppt", "pptx", "txt", "jpg", "png"].map(
								(type) => (
									<label key={type} className="flex items-center space-x-2">
										<input
											type="checkbox"
											checked={settings.allowedFileTypes.includes(type)}
											onChange={(e) => {
												if (e.target.checked) {
													handleInputChange("allowedFileTypes", [
														...settings.allowedFileTypes,
														type,
													]);
												} else {
													handleInputChange(
														"allowedFileTypes",
														settings.allowedFileTypes.filter((t) => t !== type)
													);
												}
											}}
											className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
										/>
										<span className="text-sm text-gray-700">
											.{type.toUpperCase()}
										</span>
									</label>
								)
							)}
						</div>
					</div>
				</div>
			</div>

			{/* System Settings */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					System Settings
				</h3>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-gray-700">Auto-Approval</h4>
							<p className="text-sm text-gray-500">
								Automatically approve uploads without manual review
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={settings.autoApproval}
								onChange={(e) =>
									handleInputChange("autoApproval", e.target.checked)
								}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
						</label>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-gray-700">Email Notifications</h4>
							<p className="text-sm text-gray-500">
								Send email notifications for important events
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={settings.emailNotifications}
								onChange={(e) =>
									handleInputChange("emailNotifications", e.target.checked)
								}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
						</label>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-gray-700">Maintenance Mode</h4>
							<p className="text-sm text-gray-500">
								Temporarily disable public access to the site
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={settings.maintenanceMode}
								onChange={(e) =>
									handleInputChange("maintenanceMode", e.target.checked)
								}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
						</label>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-gray-700">Open Registration</h4>
							<p className="text-sm text-gray-500">
								Allow new users to register accounts
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={settings.registrationOpen}
								onChange={(e) =>
									handleInputChange("registrationOpen", e.target.checked)
								}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
						</label>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<h4 className="font-medium text-gray-700">
								Moderator Auto-Approval
							</h4>
							<p className="text-sm text-gray-500">
								Automatically approve moderator requests
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={settings.moderatorAutoApproval}
								onChange={(e) =>
									handleInputChange("moderatorAutoApproval", e.target.checked)
								}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
						</label>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<div className="flex space-x-4">
					<button
						onClick={handleSaveSettings}
						className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium"
					>
						💾 Save Settings
					</button>
					<button
						onClick={handleResetSettings}
						className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
					>
						🔄 Reset to Defaults
					</button>
				</div>
			</div>

			{/* Current Status */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-xl font-bold text-gray-800 mb-4">
					Current System Status
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="text-center">
						<div
							className={`text-2xl mb-2 ${
								settings.maintenanceMode ? "text-red-500" : "text-green-500"
							}`}
						>
							{settings.maintenanceMode ? "🔴" : "🟢"}
						</div>
						<p className="font-medium">
							{settings.maintenanceMode ? "Maintenance" : "Online"}
						</p>
					</div>
					<div className="text-center">
						<div
							className={`text-2xl mb-2 ${
								settings.registrationOpen ? "text-green-500" : "text-red-500"
							}`}
						>
							{settings.registrationOpen ? "✅" : "❌"}
						</div>
						<p className="font-medium">Registration</p>
					</div>
					<div className="text-center">
						<div
							className={`text-2xl mb-2 ${
								settings.autoApproval ? "text-yellow-500" : "text-blue-500"
							}`}
						>
							{settings.autoApproval ? "🚀" : "👤"}
						</div>
						<p className="font-medium">
							{settings.autoApproval ? "Auto" : "Manual"} Approval
						</p>
					</div>
					<div className="text-center">
						<div
							className={`text-2xl mb-2 ${
								settings.emailNotifications ? "text-green-500" : "text-gray-400"
							}`}
						>
							{settings.emailNotifications ? "📧" : "📪"}
						</div>
						<p className="font-medium">Email Notifications</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Settings;
