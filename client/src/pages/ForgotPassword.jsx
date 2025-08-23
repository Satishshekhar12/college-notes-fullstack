import React, { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState({
		loading: false,
		sent: false,
		error: null,
	});

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!email) {
			setStatus({
				loading: false,
				sent: false,
				error: "Please enter your email address",
			});
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setStatus({
				loading: false,
				sent: false,
				error: "Please enter a valid email address",
			});
			return;
		}

		setStatus({ loading: true, sent: false, error: null });

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to send reset email");
			}

			setStatus({ loading: false, sent: true, error: null });
		} catch (error) {
			setStatus({
				loading: false,
				sent: false,
				error: error.message || "Failed to send reset email. Please try again.",
			});
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="bg-white rounded-2xl shadow-xl p-8">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="mx-auto h-16 w-16 bg-gradient-to-r from-[#62BDBD] to-[#1F9FA3] rounded-full flex items-center justify-center mb-4">
							<span className="text-2xl text-white">🔒</span>
						</div>
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Forgot Password?
						</h2>
						<p className="text-gray-600">
							No worries! Enter your email address and we'll send you a link to
							reset your password.
						</p>
					</div>

					{/* Success Message */}
					{status.sent && (
						<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
							<div className="flex items-start gap-3">
								<span className="text-green-500 text-xl">✅</span>
								<div>
									<h3 className="text-green-800 font-medium mb-1">
										Reset Link Sent!
									</h3>
									<p className="text-green-700 text-sm">
										We've sent a password reset link to <strong>{email}</strong>
										. Check your email and click the link to reset your
										password.
									</p>
									<p className="text-green-600 text-xs mt-2">
										💡 The link will expire in 10 minutes for security reasons.
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
								<p className="text-red-800 font-medium">{status.error}</p>
							</div>
						</div>
					)}

					{/* Form */}
					{!status.sent && (
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-semibold text-gray-700 mb-2"
								>
									Email Address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F9FA3] focus:border-[#1F9FA3] transition-colors placeholder-gray-400"
									placeholder="Enter your email address"
									disabled={status.loading}
								/>
							</div>

							<button
								type="submit"
								disabled={status.loading}
								className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
									status.loading
										? "bg-gray-400 cursor-not-allowed"
										: "bg-gradient-to-r from-[#62BDBD] to-[#1F9FA3] hover:from-[#5AA9A9] hover:to-[#1A8C8F] transform hover:scale-105 shadow-lg hover:shadow-xl"
								}`}
							>
								{status.loading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
										Sending Reset Link...
									</>
								) : (
									<>
										<span className="text-lg">📧</span>
										Send Reset Link
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

					{/* Additional Help */}
					{status.sent && (
						<div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
							<h4 className="text-blue-800 font-medium mb-2">
								📬 Didn't receive the email?
							</h4>
							<ul className="text-blue-700 text-sm space-y-1">
								<li>• Check your spam/junk folder</li>
								<li>• Make sure you entered the correct email address</li>
								<li>• Wait a few minutes for the email to arrive</li>
								<li>• Try submitting the form again if needed</li>
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ForgotPassword;
