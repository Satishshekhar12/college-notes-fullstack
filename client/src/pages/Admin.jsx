import React, { useState, useEffect } from "react";
import {
	adminLogin,
	adminLogout,
	isAdminLoggedIn,
	startAdminGoogleLogin,
	exchangeAdminCookieForToken,
} from "../services/adminService";
import { API_BASE_URL } from "../config/api";
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

	// Debug log for isLoggedIn state changes
	useEffect(() => {
		console.log("🔄 Admin isLoggedIn state changed to:", isLoggedIn);
	}, [isLoggedIn]);

	useEffect(() => {
		console.log("🔍 Admin useEffect running, checking login status...");

		// Check if admin is already logged in
		if (isAdminLoggedIn()) {
			console.log("✅ Admin already logged in, setting state");
			setIsLoggedIn(true);
		} else {
			console.log("❌ Admin not logged in");
		}

		// Handle Google OAuth return
		const urlParams = new URLSearchParams(window.location.search);
		const fromGoogle = urlParams.get("from");
		console.log("🔍 URL params - from:", fromGoogle);

		if (fromGoogle === "google") {
			console.log("🔄 Handling Google OAuth return...");
			const handleGoogleLogin = async () => {
				try {
					setError("");
					console.log("🔄 Calling exchangeAdminCookieForToken...");
					const success = await exchangeAdminCookieForToken();
					console.log("📊 Admin Google login result:", success);

					if (success) {
						// Check if admin is now logged in
						console.log("🔍 Checking if admin is now logged in...");
						const isNowLoggedIn = isAdminLoggedIn();
						console.log("📊 isAdminLoggedIn result:", isNowLoggedIn);

						if (isNowLoggedIn) {
							console.log(
								"✅ Admin Google login successful, switching to admin panel"
							);
							setIsLoggedIn(true);
							setActiveSection("dashboard");
						} else {
							console.log(
								"❌ Admin Google login failed: User lacks admin privileges"
							);
							setError(
								"Access denied. You need admin privileges to access this panel."
							);
						}
					} else {
						console.log("❌ Admin Google login failed: Token exchange failed");
						setError(
							"Google login failed. Please try again or check your admin privileges."
						);
					}

					// Clean up URL
					console.log("🔄 Cleaning up URL...");
					window.history.replaceState(
						{},
						document.title,
						window.location.pathname
					);
				} catch (error) {
					console.error("❌ Admin Google login error:", error);
					setError(error.message || "Google login failed. Please try again.");
				}
			};
			handleGoogleLogin();
		}
	}, []);

	// Fallback: If user Google flow already stored a token and role is admin, mirror to admin storage
	useEffect(() => {
		try {
			const userToken = localStorage.getItem("userToken");
			const rawUser = localStorage.getItem("user");
			if (userToken && rawUser && !localStorage.getItem("adminToken")) {
				const user = JSON.parse(rawUser);
				if (["admin", "moderator", "senior moderator"].includes(user?.role)) {
					console.log(
						"🔁 Mirroring user token to admin token due to admin role"
					);
					localStorage.setItem("adminToken", userToken);
					localStorage.setItem("adminUser", JSON.stringify(user));
					setIsLoggedIn(true);
				}
			}
		} catch (e) {
			console.warn("⚠️ Failed to mirror user token to admin:", e);
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

	console.log("🔍 Admin component rendering, isLoggedIn:", isLoggedIn);

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

					{/* Google Login Button */}
					<div className="mt-4">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">Or</span>
							</div>
						</div>
						<button
							onClick={startAdminGoogleLogin}
							disabled={loading}
							className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</button>
					</div>

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
