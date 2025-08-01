import React, { useState, useEffect } from "react";
import {
	adminLogin,
	adminLogout,
	isAdminLoggedIn,
} from "../services/adminService";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import Dashboard from "../components/admin/Dashboard.jsx";
import ManageModerators from "../components/admin/ManageModerators.jsx";
import ApproveUploads from "../components/admin/ApproveUploads.jsx";
import UserRequests from "../components/admin/UserRequests.jsx";
import Settings from "../components/admin/Settings.jsx";
import ForgotPassword from "../components/admin/ForgotPassword.jsx";

function Admin() {
	const [activeSection, setActiveSection] = useState("dashboard");
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [loginData, setLoginData] = useState({
		email: "",
		password: "",
	});

	useEffect(() => {
		// Check if admin is already logged in
		if (isAdminLoggedIn()) {
			setIsLoggedIn(true);
		}
	}, []);

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const result = await adminLogin(loginData.email, loginData.password);

			if (result.status === "success") {
				setIsLoggedIn(true);
				setLoginData({ email: "", password: "" });
			} else {
				setError("Login failed. Please check your credentials.");
			}
		} catch (err) {
			setError(err.message || "Login failed. Please check your credentials.");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		adminLogout();
		setIsLoggedIn(false);
		setActiveSection("dashboard");
	};

	const renderContent = () => {
		switch (activeSection) {
			case "dashboard":
				return <Dashboard />;
			case "moderators":
				return <ManageModerators />;
			case "uploads":
				return <ApproveUploads />;
			case "requests":
				return <UserRequests />;
			case "settings":
				return <Settings />;
			default:
				return <Dashboard />;
		}
	};

	if (!isLoggedIn) {
		// Show forgot password component if requested
		if (showForgotPassword) {
			return (
				<ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
			);
		}

		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
						🔐 Admin Login
					</h2>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								type="email"
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
								value={loginData.email}
								onChange={(e) =>
									setLoginData({ ...loginData, email: e.target.value })
								}
								placeholder="admin@college-notes.com"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Password
							</label>
							<input
								type="password"
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
								value={loginData.password}
								onChange={(e) =>
									setLoginData({ ...loginData, password: e.target.value })
								}
								placeholder="Enter password"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition duration-200 disabled:opacity-50"
						>
							{loading ? "Logging in..." : "Login"}
						</button>
					</form>

					{/* Forgot Password Link */}
					<div className="mt-4 text-center">
						<button
							onClick={() => setShowForgotPassword(true)}
							className="text-teal-500 hover:text-teal-600 text-sm font-medium"
						>
							Forgot your password?
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 pt-20">
			<div className="flex">
				{/* Sidebar Component */}
				<AdminSidebar
					activeSection={activeSection}
					setActiveSection={setActiveSection}
					handleLogout={handleLogout}
				/>

				{/* Main Content */}
				<div className="ml-80 flex-1 p-6">
					<div className="max-w-6xl mx-auto">
						<div className="mb-6">
							<h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
							<p className="text-gray-600 mt-2">
								Manage your college notes platform
							</p>
						</div>
						{renderContent()}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Admin;
