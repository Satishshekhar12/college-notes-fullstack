import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	userLogin,
	userSignup,
	userForgotPassword,
	exchangeCookieForToken,
} from "../services/userService";
import { API_BASE_URL } from "../config/api";
import { colleges } from "../data/colleges";
import {
	getCoursesByCollege,
	getMaxSemesters,
	generateSemesterOptions,
} from "../utils/courseHelper";

function Login() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("login");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const [loginData, setLoginData] = useState({
		email: "",
		password: "",
	});

	const [signupData, setSignupData] = useState({
		name: "",
		email: "",
		password: "",
		passwordConfirm: "",
		collegeName: "",
		course: "",
		customCourse: "",
		semester: "",
		studentType: "",
	});

	const [availableCourses, setAvailableCourses] = useState([]);
	const [semesterOptions, setSemesterOptions] = useState([]);

	// If redirected back from Google, exchange cookie for token and update UI
	React.useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("from") === "google") {
			(async () => {
				setLoading(true);
				setError("");
				try {
					// Fallback: read token from URL hash (added by server) to bypass 3rd‑party cookie blocks
					let ok = false;
					const hash = window.location.hash || "";
					const match = hash.match(/token=([^&]+)/);
					if (match && match[1]) {
						const tokenFromHash = decodeURIComponent(match[1]);
						try {
							localStorage.setItem("userToken", tokenFromHash);
							// Let listeners know immediately
							window.dispatchEvent(new Event("userLogin"));
							// Try to fetch user profile so UI has role/name
							try {
								const profRes = await fetch(`${API_BASE_URL}/me`, {
									headers: {
										Authorization: `Bearer ${tokenFromHash}`,
									},
								});
								if (profRes.ok) {
									const prof = await profRes.json();
									if (prof?.data?.user) {
										localStorage.setItem(
											"user",
											JSON.stringify(prof.data.user)
										);
										// If admin-capable, mirror to admin storage too
										const role = prof.data.user.role;
										if (
											["admin", "moderator", "senior moderator"].includes(
												role
											)
										) {
											localStorage.setItem("adminToken", tokenFromHash);
											localStorage.setItem(
												"adminUser",
												JSON.stringify(prof.data.user)
											);
											window.dispatchEvent(new Event("adminLogin"));
										}
									}
								}
							} catch (e) {
								console.warn("Failed to fetch user profile after hash token", e);
							}
							ok = true;
						} catch (e) {
							console.warn("Failed to persist token from URL hash", e);
						}
					}

					// If not obtained via hash, try cookie exchange as before
					if (!ok) {
						ok = await exchangeCookieForToken();
					}
					if (ok) {
						setSuccess("Logged in with Google.");
						// Clean the URL
						window.history.replaceState({}, "", window.location.pathname);
						// Notify navbar to switch Login → Profile immediately
						window.dispatchEvent(new Event("userLogin"));
					} else {
						setError("Google login failed. Please try again.");
					}
				} finally {
					setLoading(false);
				}
			})();
		}
	}, []);

	// Handle college selection change
	const handleCollegeChange = (collegeId) => {
		const courses = getCoursesByCollege(collegeId);
		setAvailableCourses(courses);
		setSignupData({
			...signupData,
			collegeName: collegeId,
			course: "",
			semester: "",
		});
		setSemesterOptions([]);
	};

	// Handle course change
	const handleCourseChange = (courseKey) => {
		const maxSems = getMaxSemesters(courseKey, signupData.collegeName);
		const semesters = generateSemesterOptions(maxSems);
		setSemesterOptions(semesters);
		setSignupData({
			...signupData,
			course: courseKey,
			semester: "",
		});
	};

	const [forgotEmail, setForgotEmail] = useState("");
	const [showForgotPassword, setShowForgotPassword] = useState(false);

	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const result = await userLogin(loginData.email, loginData.password);
			if (result.status === "success") {
				// Give a small delay to ensure token is stored, then trigger update
				setTimeout(() => {
					window.dispatchEvent(new Event("userLogin"));
				}, 100);
				navigate("/profile");
			}
		} catch (err) {
			setError(err.message || "Login failed. Please check your credentials.");
		} finally {
			setLoading(false);
		}
	};

	// Google Login: redirect to server OAuth start
	const handleGoogleLogin = () => {
		const url = `${API_BASE_URL}/api/auth/google`;
		console.log("Starting Google OAuth with URL:", url);
		window.location.href = url;
	};

	const handleSignup = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		if (signupData.password !== signupData.passwordConfirm) {
			setError("Passwords do not match!");
			setLoading(false);
			return;
		}

		try {
			const result = await userSignup(
				signupData.name,
				signupData.email,
				signupData.password,
				signupData.passwordConfirm,
				signupData.collegeName,
				signupData.course,
				parseInt(signupData.semester),
				signupData.studentType
			);
			if (result.status === "success") {
				// Give a small delay to ensure token is stored, then trigger update
				setTimeout(() => {
					window.dispatchEvent(new Event("userLogin"));
				}, 100);
				navigate("/profile");
			}
		} catch (err) {
			setError(err.message || "Signup failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleForgotPassword = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const result = await userForgotPassword(forgotEmail);
			if (result.status === "success") {
				setSuccess("Password reset link has been sent to your email!");
				setForgotEmail("");
			}
		} catch (err) {
			setError(err.message || "Failed to send reset email. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (showForgotPassword) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
						🔐 Forgot Password
					</h2>

					<p className="text-gray-600 text-center mb-6">
						Enter your email address and we'll send you a link to reset your
						password.
					</p>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}

					{success && (
						<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
							{success}
						</div>
					)}

					<form onSubmit={handleForgotPassword} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email Address
							</label>
							<input
								type="email"
								required
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
								value={forgotEmail}
								onChange={(e) => setForgotEmail(e.target.value)}
								placeholder="your.email@example.com"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition duration-200 disabled:opacity-50"
						>
							{loading ? "Sending..." : "Send Reset Link"}
						</button>
					</form>

					<div className="mt-6 text-center">
						<button
							onClick={() => setShowForgotPassword(false)}
							className="text-teal-500 hover:text-teal-600 text-sm font-medium"
						>
							← Back to Login
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* Admin application instructions */}
			<div class="mt-16 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-xl text-m">
				<p>
					<strong>Important:</strong> To be considered for{" "}
					<i>
						<b>course admin privileges</b>
					</i>{" "}
					, please sign up and upload at least{" "}
					<strong>10–20 high-quality college materials</strong>. Once complete,
					send an email from <b> your college email</b> account to{" "}
					<a
						href="mailto:notes.helper0@gmail.com"
						className="text-blue-600 underline"
					>
						notes.helper0@gmail.com
					</a>{" "}
					with your name, course details, and a valid mobile number.
				</p>
			</div>

			{/* instruction */}
			<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-2 pb-2">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
					{/* Tab Navigation */}
					<div className="flex mb-6">
						<button
							onClick={() => setActiveTab("login")}
							className={`flex-1 py-2 px-4 text-center font-medium rounded-l-lg ${
								activeTab === "login"
									? "bg-teal-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Login
						</button>
						<button
							onClick={() => setActiveTab("signup")}
							className={`flex-1 py-2 px-4 text-center font-medium rounded-r-lg ${
								activeTab === "signup"
									? "bg-teal-500 text-white"
									: "bg-gray-200 text-gray-700 hover:bg-gray-300"
							}`}
						>
							Sign Up
						</button>
					</div>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
							{error}
						</div>
					)}

					{success && (
						<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
							{success}
						</div>
					)}

					{/* Login Form */}
					{activeTab === "login" && (
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
									placeholder="your.email@example.com"
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

							{/* Google Login Button */}
							<div className="mt-4">
								<button
									type="button"
									onClick={handleGoogleLogin}
									className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
								>
									<img
										src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
										alt="Google"
										className="w-5 h-5"
									/>
									<span>Continue with Google</span>
								</button>
							</div>

							{/* Forgot Password Link */}
							<div className="text-center">
								<button
									type="button"
									onClick={() => setShowForgotPassword(true)}
									className="text-teal-500 hover:text-teal-600 text-sm font-medium"
								>
									Forgot your password?
								</button>
							</div>
						</form>
					)}

					{/* Signup Form */}
					{activeTab === "signup" && (
						<form onSubmit={handleSignup} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Full Name
								</label>
								<input
									type="text"
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.name}
									onChange={(e) =>
										setSignupData({ ...signupData, name: e.target.value })
									}
									placeholder="Enter your full name"
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
									value={signupData.email}
									onChange={(e) =>
										setSignupData({ ...signupData, email: e.target.value })
									}
									placeholder="your.email@example.com"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Password
								</label>
								<input
									type="password"
									required
									minLength="8"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.password}
									onChange={(e) =>
										setSignupData({ ...signupData, password: e.target.value })
									}
									placeholder="Enter password (min 8 characters)"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Confirm Password
								</label>
								<input
									type="password"
									required
									minLength="8"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.passwordConfirm}
									onChange={(e) =>
										setSignupData({
											...signupData,
											passwordConfirm: e.target.value,
										})
									}
									placeholder="Confirm password"
								/>
							</div>

							{/* College Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									College
								</label>
								<select
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.collegeName}
									onChange={(e) => handleCollegeChange(e.target.value)}
								>
									<option value="">Select your college</option>
									{colleges.map((college) => (
										<option key={college.id} value={college.id}>
											{college.name}
										</option>
									))}
								</select>
							</div>

							{/* Course Selection */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Course
								</label>
								<select
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.course}
									onChange={(e) => handleCourseChange(e.target.value)}
									disabled={!signupData.collegeName}
								>
									<option value="">Select your course</option>
									{availableCourses.map((course) => (
										<option key={course.key} value={course.key}>
											{course.name}
										</option>
									))}
									<option value="other">Other (Not listed)</option>
								</select>
							</div>

							{/* Custom Course Input for "Other" */}
							{signupData.course === "other" && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Specify your course
									</label>
									<input
										type="text"
										required
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
										value={signupData.customCourse || ""}
										onChange={(e) =>
											setSignupData({
												...signupData,
												customCourse: e.target.value,
												course: e.target.value,
											})
										}
										placeholder="Enter your course name"
									/>
								</div>
							)}

							{/* Student Type */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Student Type
								</label>
								<select
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.studentType}
									onChange={(e) =>
										setSignupData({
											...signupData,
											studentType: e.target.value,
										})
									}
								>
									<option value="">Select student type</option>
									<option value="UG">Undergraduate (UG)</option>
									<option value="PG">Postgraduate (PG)</option>
									<option value="PhD">PhD</option>
								</select>
							</div>

							{/* Semester */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Current Semester
								</label>
								<select
									required
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
									value={signupData.semester}
									onChange={(e) =>
										setSignupData({ ...signupData, semester: e.target.value })
									}
									disabled={!signupData.course || signupData.course === "other"}
								>
									<option value="">Select semester</option>
									{semesterOptions.map((sem) => (
										<option key={sem.value} value={sem.value}>
											{sem.label}
										</option>
									))}
								</select>
								{(signupData.course === "other" || !signupData.course) && (
									<div className="mt-1">
										<input
											type="number"
											min="1"
											max="12"
											className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
											value={signupData.semester}
											onChange={(e) =>
												setSignupData({
													...signupData,
													semester: e.target.value,
												})
											}
											placeholder="Enter semester number (1-12)"
										/>
									</div>
								)}
							</div>
							<button
								type="submit"
								disabled={loading}
								className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition duration-200 disabled:opacity-50"
							>
								{loading ? "Creating Account..." : "Sign Up"}
							</button>
						</form>
					)}

					{/* Admin Login Link */}
					<div className="mt-6 pt-4 border-t border-gray-200 text-center">
						<p className="text-sm text-gray-600 mb-2">Admin Access?</p>
						<Link
							to="/admin"
							className="text-teal-500 hover:text-teal-600 text-sm font-medium"
						>
							Go to Admin Login →
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}

export default Login;
