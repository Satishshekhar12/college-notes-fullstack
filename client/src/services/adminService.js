//this api/link may be diffrent to server check server read all file and update accordingly
import { API_BASE_URL } from "../config/api";

// Admin Authentication
export const adminLogin = async (email, password) => {
	try {
		const response = await fetch(`${API_BASE_URL}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Login failed");
		}

		const result = await response.json();

		// Check if user has admin privileges
		if (result.status === "success" && result.token && result.user) {
			const { user } = result;
			
			// Verify user has admin/moderator role
			if (!["admin", "moderator", "senior moderator"].includes(user.role)) {
				throw new Error("Access denied. Admin privileges required.");
			}

			// Store token and user info in localStorage
			localStorage.setItem("adminToken", result.token);
			localStorage.setItem("adminUser", JSON.stringify(user));
		}

		return result;
	} catch (error) {
		console.error("❌ Admin login failed:", error);
		throw error;
	}
};

// Forgot Password
export const forgotPassword = async (email) => {
	try {
		const response = await fetch(`${API_BASE_URL}/forgotPassword`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to send reset email");
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Forgot password failed:", error);
		throw error;
	}
};

// Reset Password
export const resetPassword = async (token, password, passwordConfirm) => {
	try {
		const response = await fetch(`${API_BASE_URL}/resetPassword/${token}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ password, passwordConfirm }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to reset password");
		}

		const result = await response.json();

		// Store token and user info if reset is successful
		if (result.status === "success" && result.token && result.user) {
			const { user } = result;
			
			// Verify user has admin privileges
			if (["admin", "moderator", "senior moderator"].includes(user.role)) {
				localStorage.setItem("adminToken", result.token);
				localStorage.setItem("adminUser", JSON.stringify(user));
			}
		}

		return result;
	} catch (error) {
		console.error("❌ Reset password failed:", error);
		throw error;
	}
};

export const adminLogout = () => {
	localStorage.removeItem("adminToken");
	localStorage.removeItem("adminUser");
};

export const getStoredAdmin = () => {
	const token = localStorage.getItem("adminToken");

	if (token) {
		return { token };
	}
	return null;
};

export const isAdminLoggedIn = () => {
	const token = localStorage.getItem("adminToken");
	const userData = localStorage.getItem("adminUser");
	
	if (!token || !userData) {
		return false;
	}
	
	try {
		const user = JSON.parse(userData);
		// Check if user has admin/moderator role
		return ["admin", "moderator", "senior moderator"].includes(user.role);
	} catch (error) {
		console.error("❌ Error parsing admin user data:", error);
		// Clear invalid data
		adminLogout();
		return false;
	}
};

// Get current admin user data
export const getCurrentAdminUser = () => {
	const userData = localStorage.getItem("adminUser");
	if (!userData) {
		return null;
	}
	
	try {
		return JSON.parse(userData);
	} catch (error) {
		console.error("❌ Error parsing admin user data:", error);
		adminLogout();
		return null;
	}
};

// Get auth headers for API requests
export const getAuthHeaders = () => {
	const token = localStorage.getItem("adminToken");
	return token
		? {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
		  }
		: {
				"Content-Type": "application/json",
		  };
};

// Admin API calls
export const fetchPendingUploads = async (page = 1, limit = 20) => {
	try {
		const response = await fetch(
			`${API_BASE_URL}/api/admin/pending-uploads?page=${page}&limit=${limit}`,
			{
				method: "GET",
				headers: getAuthHeaders(),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to fetch pending uploads");
		}

		return await response.json();
	} catch (error) {
		console.error("Error fetching pending uploads:", error);
		throw error;
	}
};

export const approveUpload = async (uploadId) => {
	try {
		const response = await fetch(
			`${API_BASE_URL}/api/admin/approve-upload/${uploadId}`,
			{
				method: "POST",
				headers: getAuthHeaders(),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to approve upload");
		}

		return await response.json();
	} catch (error) {
		console.error("Error approving upload:", error);
		throw error;
	}
};

export const rejectUpload = async (uploadId, reason) => {
	try {
		const response = await fetch(
			`${API_BASE_URL}/api/admin/reject-upload/${uploadId}`,
			{
				method: "POST",
				headers: getAuthHeaders(),
				body: JSON.stringify({ reason }),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to reject upload");
		}

		return await response.json();
	} catch (error) {
		console.error("Error rejecting upload:", error);
		throw error;
	}
};

export const getUploadStats = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to get stats");
		}

		return await response.json();
	} catch (error) {
		console.error("Error getting stats:", error);
		throw error;
	}
};
