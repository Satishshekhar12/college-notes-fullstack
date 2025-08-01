import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import {
	getUserProfile,
	updateUserProfile,
	updateUserPassword,
	userLogout,
	isUserLoggedIn,
} from "../services/userService";
import { useNavigate } from "react-router-dom";

function Profile() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [userStats, setUserStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [activeTab, setActiveTab] = useState("profile");

	// Profile form state
	const [profileData, setProfileData] = useState({
		name: "",
		email: "",
	});

	// Password form state
	const [passwordData, setPasswordData] = useState({
		passwordCurrent: "",
		password: "",
		passwordConfirm: "",
	});

	useEffect(() => {
		// Check if user is logged in
		if (!isUserLoggedIn()) {
			navigate("/login");
			return;
		}

		console.log("🔄 Profile component mounting, fetching user data...");
		const fetchData = async () => {
			try {
				setLoading(true);
				const response = await getUserProfile();
				if (response.status === "success") {
					console.log("👤 User profile loaded:", response.data.user);
					setUser(response.data.user);
					setProfileData({
						name: response.data.user.name || "",
						email: response.data.user.email || "",
					});
					// Fetch user statistics
					await fetchUserStats();
				}
			} catch (err) {
				setError(err.message || "Failed to fetch profile");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [navigate]);

	const fetchUserStats = async () => {
		try {
			const token = localStorage.getItem("userToken");
			if (!token) return;

			console.log("🔄 Fetching user stats from /api/notes/user/my-notes");
			const response = await fetch(`${API_BASE_URL}/api/notes/user/my-notes`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				const userNotes = data.data.notes || [];
				console.log("📊 Fetched user notes:", userNotes.length, "notes");
				console.log(
					"📝 Note statuses:",
					userNotes.map((note) => note.status)
				);

				// Calculate user statistics
				const stats = {
					totalUploads: userNotes.length,
					approvedCount: userNotes.filter((note) => note.status === "approved")
						.length,
					rejectedCount: userNotes.filter((note) => note.status === "rejected")
						.length,
					pendingCount: userNotes.filter((note) => note.status === "pending")
						.length,
				};

				console.log("📈 Calculated stats:", stats);
				setUserStats(stats);
			} else {
				console.error(
					"❌ Failed to fetch user notes:",
					response.status,
					response.statusText
				);
			}
		} catch (err) {
			console.error("❌ Failed to fetch user stats:", err);
		}
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

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		try {
			const response = await updateUserProfile(profileData);
			if (response.status === "success") {
				setUser(response.data.user);
				setSuccess("Profile updated successfully!");
			}
		} catch (err) {
			setError(err.message || "Failed to update profile");
		}
	};

	const handlePasswordUpdate = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		// Validate passwords match
		if (passwordData.password !== passwordData.passwordConfirm) {
			setError("New passwords do not match!");
			return;
		}

		try {
			const response = await updateUserPassword(
				passwordData.passwordCurrent,
				passwordData.password,
				passwordData.passwordConfirm
			);
			if (response.status === "success") {
				setSuccess("Password updated successfully!");
				setPasswordData({
					passwordCurrent: "",
					password: "",
					passwordConfirm: "",
				});
			}
		} catch (err) {
			setError(err.message || "Failed to update password");
		}
	};

	const handleLogout = () => {
		userLogout();
		navigate("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
				<div className="bg-white p-8 rounded-lg shadow-md">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading profile...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Enhanced Profile Header */}
				<div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
					<div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
						<div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
							<div className="relative">
								<div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
									{user?.name?.charAt(0)?.toUpperCase() || "U"}
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
									<span className="text-white text-xs font-bold">✓</span>
								</div>
							</div>
							<div className="text-center md:text-left">
								<h1 className="text-3xl font-bold text-gray-800 mb-2">
									{user?.name || "User"}
								</h1>
								<p className="text-gray-600 text-lg mb-3">{user?.email}</p>
								<div className="flex items-center justify-center md:justify-start space-x-4">
									<span
										className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
											user?.role === "admin"
												? "bg-red-100 text-red-800 border border-red-200"
												: user?.role === "moderator"
												? "bg-blue-100 text-blue-800 border border-blue-200"
												: "bg-green-100 text-green-800 border border-green-200"
										}`}
									>
										🎯 {user?.role?.toUpperCase() || "USER"}
									</span>
									<span className="text-sm text-gray-500">
										📅 Member since{" "}
										{user?.createdAt
											? new Date(user.createdAt).toLocaleDateString("en-US", {
													month: "long",
													year: "numeric",
											  })
											: "Unknown"}
									</span>
								</div>

								{/* Academic Information */}
								<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											🏫 College
										</div>
										<div className="text-gray-800 capitalize">
											{user?.collegeName === "bhu"
												? "Banaras Hindu University (BHU)"
												: user?.collegeName === "nitk"
												? "National Institute of Technology Karnataka (NITK)"
												: user?.collegeName || "Not specified"}
										</div>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											📚 Course
										</div>
										<div className="text-gray-800 capitalize">
											{user?.course || "Not specified"}
										</div>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											🎓 Student Type
										</div>
										<div className="text-gray-800">
											{user?.studentType === "UG"
												? "Undergraduate"
												: user?.studentType === "PG"
												? "Postgraduate"
												: user?.studentType === "PhD"
												? "PhD Student"
												: user?.studentType || "Not specified"}
										</div>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											📝 Current Semester
										</div>
										<div className="text-gray-800">
											{user?.semester
												? `Semester ${user.semester}`
												: "Not specified"}
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
							<button
								onClick={fetchUserStats}
								className="w-full sm:w-auto px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-200 flex items-center justify-center space-x-2 shadow-md"
								title="Refresh statistics"
							>
								<span>🔄</span>
								<span>Refresh Stats</span>
							</button>
							<button
								onClick={handleLogout}
								className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition duration-300 shadow-md hover:shadow-lg"
							>
								🚪 Logout
							</button>
						</div>
					</div>
				</div>

				{/* User Statistics Dashboard */}
				{userStats && (
					<>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
							<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-blue-100 text-sm font-medium">
											Total Uploads
										</p>
										<p className="text-3xl font-bold">
											{userStats.totalUploads}
										</p>
									</div>
									<div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">📊</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-green-100 text-sm font-medium">
											Approved
										</p>
										<p className="text-3xl font-bold">
											{userStats.approvedCount}
										</p>
									</div>
									<div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">✅</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-red-100 text-sm font-medium">Rejected</p>
										<p className="text-3xl font-bold">
											{userStats.rejectedCount}
										</p>
									</div>
									<div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">❌</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-purple-100 text-sm font-medium">
											Success Rate
										</p>
										<p className="text-3xl font-bold">
											{getApprovalRate(userStats)}%
										</p>
									</div>
									<div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">🎯</span>
									</div>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Pending Status Alert */}
				{userStats && userStats.pendingCount > 0 && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
								<span className="text-white text-lg">⏳</span>
							</div>
							<div>
								<h3 className="text-yellow-800 font-semibold text-lg">
									You have {userStats.pendingCount} upload
									{userStats.pendingCount !== 1 ? "s" : ""} pending review
								</h3>
								<p className="text-yellow-700">
									Your uploads are being reviewed by our moderation team. You'll
									be notified once they're approved.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Enhanced Tab Navigation */}
				<div className="bg-white rounded-xl shadow-lg overflow-hidden">
					<div className="border-b border-gray-200">
						<nav className="flex">
							<button
								onClick={() => setActiveTab("profile")}
								className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center space-x-2 transition duration-200 ${
									activeTab === "profile"
										? "border-b-2 border-teal-500 text-teal-600 bg-teal-50"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="text-lg">👤</span>
								<span>Profile Information</span>
							</button>
							<button
								onClick={() => setActiveTab("password")}
								className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center space-x-2 transition duration-200 ${
									activeTab === "password"
										? "border-b-2 border-teal-500 text-teal-600 bg-teal-50"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="text-lg">🔒</span>
								<span>Change Password</span>
							</button>
						</nav>
					</div>

					<div className="p-8">
						{/* Error/Success Messages */}
						{error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-3">
								<span className="text-lg">❌</span>
								<span>{error}</span>
							</div>
						)}
						{success && (
							<div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center space-x-3">
								<span className="text-lg">✅</span>
								<span>{success}</span>
							</div>
						)}

						{/* Enhanced Profile Tab */}
						{activeTab === "profile" && (
							<div className="max-w-2xl">
								<div className="mb-8">
									<h2 className="text-2xl font-bold text-gray-800 mb-2">
										Personal Information
									</h2>
									<p className="text-gray-600">
										Update your account details and personal information.
									</p>
								</div>

								<form onSubmit={handleProfileUpdate} className="space-y-8">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>👤</span>
													<span>Full Name</span>
												</span>
											</label>
											<input
												type="text"
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={profileData.name}
												onChange={(e) =>
													setProfileData({
														...profileData,
														name: e.target.value,
													})
												}
												placeholder="Enter your full name"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>📧</span>
													<span>Email Address</span>
												</span>
											</label>
											<input
												type="email"
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={profileData.email}
												onChange={(e) =>
													setProfileData({
														...profileData,
														email: e.target.value,
													})
												}
												placeholder="Enter your email address"
											/>
										</div>
									</div>

									<div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
										<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
											<span>📊</span>
											<span>Account Statistics</span>
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="text-center">
												<div className="text-2xl font-bold text-teal-600">
													{userStats?.totalUploads || 0}
												</div>
												<div className="text-sm text-gray-600">
													Total Uploads
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-green-600">
													{userStats?.approvedCount || 0}
												</div>
												<div className="text-sm text-gray-600">Approved</div>
											</div>
											<div className="text-center">
												<div
													className={`text-2xl font-bold px-3 py-1 rounded-lg ${
														userStats
															? getApprovalRateColor(getApprovalRate(userStats))
															: "text-gray-600"
													}`}
												>
													{userStats ? getApprovalRate(userStats) : 0}%
												</div>
												<div className="text-sm text-gray-600">
													Success Rate
												</div>
											</div>
										</div>
									</div>

									<div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
										<h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
											<span>📅</span>
											<span>Member Information</span>
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-600 mb-1">
													Member Since
												</label>
												<p className="text-lg font-semibold text-gray-800">
													{user?.createdAt
														? new Date(user.createdAt).toLocaleDateString(
																"en-US",
																{
																	weekday: "long",
																	year: "numeric",
																	month: "long",
																	day: "numeric",
																}
														  )
														: "Unknown"}
												</p>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600 mb-1">
													Account Type
												</label>
												<span
													className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
														user?.role === "admin"
															? "bg-red-100 text-red-800 border border-red-200"
															: user?.role === "moderator"
															? "bg-blue-100 text-blue-800 border border-blue-200"
															: "bg-green-100 text-green-800 border border-green-200"
													}`}
												>
													{user?.role?.toUpperCase() || "USER"}
												</span>
											</div>
										</div>
									</div>

									<div className="flex justify-end">
										<button
											type="submit"
											className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition duration-300 shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
										>
											<span>💾</span>
											<span>Update Profile</span>
										</button>
									</div>
								</form>
							</div>
						)}

						{/* Enhanced Password Tab */}
						{activeTab === "password" && (
							<div className="max-w-2xl">
								<div className="mb-8">
									<h2 className="text-2xl font-bold text-gray-800 mb-2">
										Security Settings
									</h2>
									<p className="text-gray-600">
										Update your password to keep your account secure.
									</p>
								</div>

								<form onSubmit={handlePasswordUpdate} className="space-y-8">
									<div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-6">
										<div className="flex items-center space-x-3">
											<span className="text-2xl">🔐</span>
											<div>
												<h3 className="font-semibold text-yellow-800">
													Password Requirements
												</h3>
												<p className="text-yellow-700 text-sm">
													Your password must be at least 8 characters long and
													contain a mix of letters, numbers, and symbols.
												</p>
											</div>
										</div>
									</div>

									<div>
										<label className="block text-sm font-semibold text-gray-700 mb-3">
											<span className="flex items-center space-x-2">
												<span>🔓</span>
												<span>Current Password</span>
											</span>
										</label>
										<input
											type="password"
											required
											className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
											value={passwordData.passwordCurrent}
											onChange={(e) =>
												setPasswordData({
													...passwordData,
													passwordCurrent: e.target.value,
												})
											}
											placeholder="Enter your current password"
										/>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>🔒</span>
													<span>New Password</span>
												</span>
											</label>
											<input
												type="password"
												required
												minLength="8"
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={passwordData.password}
												onChange={(e) =>
													setPasswordData({
														...passwordData,
														password: e.target.value,
													})
												}
												placeholder="Enter new password (min 8 characters)"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>🔒</span>
													<span>Confirm New Password</span>
												</span>
											</label>
											<input
												type="password"
												required
												minLength="8"
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={passwordData.passwordConfirm}
												onChange={(e) =>
													setPasswordData({
														...passwordData,
														passwordConfirm: e.target.value,
													})
												}
												placeholder="Confirm new password"
											/>
										</div>
									</div>

									{/* Password Strength Indicator */}
									{passwordData.password && (
										<div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
											<h4 className="text-sm font-semibold text-gray-700 mb-2">
												Password Strength:
											</h4>
											<div className="space-y-2">
												<div
													className={`flex items-center space-x-2 ${
														passwordData.password.length >= 8
															? "text-green-600"
															: "text-gray-400"
													}`}
												>
													<span>
														{passwordData.password.length >= 8 ? "✅" : "⭕"}
													</span>
													<span className="text-sm">At least 8 characters</span>
												</div>
												<div
													className={`flex items-center space-x-2 ${
														/[A-Z]/.test(passwordData.password)
															? "text-green-600"
															: "text-gray-400"
													}`}
												>
													<span>
														{/[A-Z]/.test(passwordData.password) ? "✅" : "⭕"}
													</span>
													<span className="text-sm">
														Contains uppercase letter
													</span>
												</div>
												<div
													className={`flex items-center space-x-2 ${
														/[0-9]/.test(passwordData.password)
															? "text-green-600"
															: "text-gray-400"
													}`}
												>
													<span>
														{/[0-9]/.test(passwordData.password) ? "✅" : "⭕"}
													</span>
													<span className="text-sm">Contains number</span>
												</div>
											</div>
										</div>
									)}

									<div className="flex justify-end">
										<button
											type="submit"
											className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition duration-300 shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
										>
											<span>🔐</span>
											<span>Update Password</span>
										</button>
									</div>
								</form>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Profile;
