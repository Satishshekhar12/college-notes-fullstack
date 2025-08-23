import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";

const ResetPassword = () => {
	const { token } = useParams();

	const [passwords, setPasswords] = useState({
		password: "",
		passwordConfirm: "",
	});

	const [status, setStatus] = useState({
		loading: false,
		success: false,
		error: null,
	});

	const [validationErrors, setValidationErrors] = useState({});

	// Validate password length only
	const validatePassword = (password) => {
		const errors = {};

		if (password.length < 5) {
			errors.length = "Password must be at least 5 characters long";
		}

		return errors;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setPasswords((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear validation errors when user types
		if (validationErrors[name]) {
			setValidationErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}

		// Clear general error
		if (status.error) {
			setStatus((prev) => ({ ...prev, error: null }));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validate passwords
		const passwordErrors = validatePassword(passwords.password);
		const newErrors = {};

		if (Object.keys(passwordErrors).length > 0) {
			newErrors.password = "Password doesn't meet requirements";
		}

		if (passwords.password !== passwords.passwordConfirm) {
			newErrors.passwordConfirm = "Passwords don't match";
		}

		if (!passwords.password) {
			newErrors.password = "Password is required";
		}

		if (!passwords.passwordConfirm) {
			newErrors.passwordConfirm = "Please confirm your password";
		}

		if (Object.keys(newErrors).length > 0) {
			setValidationErrors(newErrors);
			return;
		}

		setStatus({ loading: true, success: false, error: null });

		try {
			const response = await fetch(`/api/auth/reset-password/${token}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					password: passwords.password,
					passwordConfirm: passwords.passwordConfirm,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to reset password");
			}

			// Store token if login is successful
			if (data.token) {
				// Clear any existing tokens first
				localStorage.removeItem("token");
				localStorage.removeItem("userToken");

				// Store the new token with the correct key
				localStorage.setItem("userToken", data.token);
			}

			setStatus({ loading: false, success: true, error: null });

			// Force a complete refresh to clear any cached authentication state
			setTimeout(() => {
				window.location.href = "/dashboard"; // Use window.location.href instead of navigate to force refresh
			}, 2000);
		} catch (error) {
			setStatus({
				loading: false,
				success: false,
				error: error.message || "Failed to reset password. Please try again.",
			});
		}
	};

	const isPasswordValid = passwords.password && passwords.password.length >= 5;

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="mx-auto h-16 w-16 bg-gradient-to-r from-[#62BDBD] to-[#1F9FA3] rounded-full flex items-center justify-center mb-4">
							<span className="text-2xl text-white">🔄</span>
						</div>
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Reset Password
						</h2>
						<p className="text-gray-600">
							Create a new password for your account.
						</p>
					</div>

					{/* Success Message */}
					{status.success && (
						<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
							<div className="flex items-start gap-3">
								<span className="text-green-500 text-xl">✅</span>
								<div>
									<h3 className="text-green-800 font-medium mb-1">
										Password Reset Successful!
									</h3>
									<p className="text-green-700 text-sm">
										Your password has been updated successfully. You are now
										logged in and will be redirected to your dashboard.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Error Message */}
					{status.error && (
						<div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
							<div className="flex items-start gap-3">
								<span className="text-red-500 text-xl">❌</span>
								<div>
									<p className="text-red-800 font-medium">{status.error}</p>
									{status.error.includes("invalid") ||
									status.error.includes("expired") ? (
										<p className="text-red-600 text-sm mt-2">
											The reset link may have expired. Please request a new
											password reset.
										</p>
									) : null}
								</div>
							</div>
						</div>
					)}

					{/* Form */}
					{!status.success && (
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* New Password */}
							<div>
								<label
									htmlFor="password"
									className="block text-sm font-semibold text-gray-700 mb-2"
								>
									New Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									required
									value={passwords.password}
									onChange={handleInputChange}
									className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#1F9FA3] focus:border-[#1F9FA3] transition-colors ${
										validationErrors.password
											? "border-red-300 bg-red-50"
											: "border-gray-200"
									}`}
									placeholder="Enter your new password"
									disabled={status.loading}
								/>
								{validationErrors.password && (
									<p className="text-red-500 text-sm mt-1">
										{validationErrors.password}
									</p>
								)}
							</div>

							{/* Password Length Indicator */}
							{passwords.password && (
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<span
											className={`text-sm ${
												passwords.password.length >= 5
													? "text-green-600"
													: "text-gray-400"
											}`}
										>
											{passwords.password.length >= 5 ? "✓" : "○"}
										</span>
										<span
											className={`text-xs ${
												passwords.password.length >= 5
													? "text-green-600"
													: "text-gray-500"
											}`}
										>
											At least 5 characters ({passwords.password.length}/5)
										</span>
									</div>
								</div>
							)}

							{/* Confirm Password */}
							<div>
								<label
									htmlFor="passwordConfirm"
									className="block text-sm font-semibold text-gray-700 mb-2"
								>
									Confirm New Password
								</label>
								<input
									id="passwordConfirm"
									name="passwordConfirm"
									type="password"
									required
									value={passwords.passwordConfirm}
									onChange={handleInputChange}
									className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#1F9FA3] focus:border-[#1F9FA3] transition-colors ${
										validationErrors.passwordConfirm
											? "border-red-300 bg-red-50"
											: "border-gray-200"
									}`}
									placeholder="Confirm your new password"
									disabled={status.loading}
								/>
								{validationErrors.passwordConfirm && (
									<p className="text-red-500 text-sm mt-1">
										{validationErrors.passwordConfirm}
									</p>
								)}
								{passwords.passwordConfirm &&
									passwords.password &&
									passwords.password === passwords.passwordConfirm && (
										<p className="text-green-600 text-sm mt-1 flex items-center gap-1">
											<span>✓</span>
											Passwords match
										</p>
									)}
							</div>

							<button
								type="submit"
								disabled={
									status.loading ||
									!isPasswordValid ||
									passwords.password !== passwords.passwordConfirm
								}
								className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
									status.loading ||
									!isPasswordValid ||
									passwords.password !== passwords.passwordConfirm
										? "bg-gray-400 cursor-not-allowed"
										: "bg-gradient-to-r from-[#62BDBD] to-[#1F9FA3] hover:from-[#5AA9A9] hover:to-[#1A8C8F] transform hover:scale-105 shadow-lg hover:shadow-xl"
								}`}
							>
								{status.loading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
										Updating Password...
									</>
								) : (
									<>
										<span className="text-lg">🔄</span>
										Update Password
									</>
								)}
							</button>
						</form>
					)}

					{/* Back to Login */}
					<div className="mt-6 text-center">
						<Link
							to="/login"
							className="text-[#1F9FA3] hover:text-[#1A8C8F] font-medium transition-colors flex items-center justify-center gap-2"
						>
							<span>←</span>
							Back to Login
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ResetPassword;
