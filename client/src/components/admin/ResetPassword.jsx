import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/adminService";

function ResetPassword() {
	const { token } = useParams();
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		password: "",
		passwordConfirm: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!token) {
			navigate("/admin");
		}
	}, [token, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		// Client-side validation
		if (formData.password !== formData.passwordConfirm) {
			setError("Passwords do not match!");
			setLoading(false);
			return;
		}

		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters long!");
			setLoading(false);
			return;
		}

		try {
			const result = await resetPassword(
				token,
				formData.password,
				formData.passwordConfirm
			);

			if (result.status === "success") {
				setSuccess(true);
				// Redirect to admin page after 2 seconds
				setTimeout(() => {
					navigate("/admin");
				}, 2000);
			}
		} catch (err) {
			setError(err.message || "Failed to reset password. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	if (success) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
				<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
					<div className="text-green-500 text-6xl mb-4">✅</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-4">
						Password Reset Successful!
					</h2>
					<p className="text-gray-600 mb-4">
						Your password has been reset successfully. You are now logged in.
					</p>
					<p className="text-sm text-gray-500">
						Redirecting to admin dashboard...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
					🔐 Reset Password
				</h2>

				{error && (
					<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							New Password
						</label>
						<input
							type="password"
							name="password"
							required
							minLength="8"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							value={formData.password}
							onChange={handleChange}
							placeholder="Enter new password (min 8 characters)"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Confirm New Password
						</label>
						<input
							type="password"
							name="passwordConfirm"
							required
							minLength="8"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
							value={formData.passwordConfirm}
							onChange={handleChange}
							placeholder="Confirm new password"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 transition duration-200 disabled:opacity-50"
					>
						{loading ? "Resetting..." : "Reset Password"}
					</button>
				</form>

				<div className="mt-6 text-center">
					<button
						onClick={() => navigate("/admin")}
						className="text-teal-500 hover:text-teal-600 text-sm font-medium"
					>
						Back to Login
					</button>
				</div>
			</div>
		</div>
	);
}

export default ResetPassword;
