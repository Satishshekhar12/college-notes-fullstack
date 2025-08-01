import React, { useState } from "react";
import { forgotPassword } from "../../services/adminService";

function ForgotPassword({ onBackToLogin }) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setMessage("");

		try {
			const result = await forgotPassword(email);

			if (result.status === "success") {
				setMessage("Password reset link has been sent to your email!");
				setEmail("");
			}
		} catch (err) {
			setError(err.message || "Failed to send reset email. Please try again.");
		} finally {
			setLoading(false);
		}
	};

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

				{message && (
					<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
						{message}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Email Address
						</label>
						<input
							type="email"
							required
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="admin@college-notes.com"
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
						onClick={onBackToLogin}
						className="text-teal-500 hover:text-teal-600 text-sm font-medium"
					>
						← Back to Login
					</button>
				</div>
			</div>
		</div>
	);
}

export default ForgotPassword;
