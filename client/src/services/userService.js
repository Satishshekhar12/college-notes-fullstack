import { API_BASE_URL } from "../config/api";

// User Authentication (for regular users, not admin)
export const userLogin = async (email, password) => {
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

		// Store token in localStorage
		if (result.status === "success" && result.token) {
			localStorage.setItem("userToken", result.token);
			// Dispatch custom event to notify components of login
			window.dispatchEvent(new Event("userLogin"));
		}

		return result;
	} catch (error) {
		console.error("❌ User login failed:", error);
		throw error;
	}
};

// User Signup
export const userSignup = async (
	name,
	email,
	password,
	passwordConfirm,
	collegeName,
	course,
	semester,
	studentType
) => {
	try {
		const response = await fetch(`${API_BASE_URL}/signup`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name,
				email,
				password,
				passwordConfirm,
				role: "user",
				collegeName,
				course,
				semester,
				studentType,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Signup failed");
		}

		const result = await response.json();

		// Store token in localStorage if signup is successful
		if (result.status === "success" && result.token) {
			localStorage.setItem("userToken", result.token);
			// Dispatch custom event to notify components of login
			window.dispatchEvent(new Event("userLogin"));
		}

		return result;
	} catch (error) {
		console.error("❌ User signup failed:", error);
		throw error;
	}
};

// Get User Profile
export const getUserProfile = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/me`, {
			method: "GET",
			headers: getUserAuthHeaders(),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to fetch user profile");
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Failed to fetch user profile:", error);
		throw error;
	}
};

// Update User Profile
export const updateUserProfile = async (userData) => {
	try {
		const response = await fetch(`${API_BASE_URL}/updateMe`, {
			method: "PATCH",
			headers: getUserAuthHeaders(),
			body: JSON.stringify(userData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to update profile");
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Failed to update profile:", error);
		throw error;
	}
};

// Update User Password
export const updateUserPassword = async (
	passwordCurrent,
	password,
	passwordConfirm
) => {
	try {
		const response = await fetch(`${API_BASE_URL}/updatePassword`, {
			method: "PATCH",
			headers: getUserAuthHeaders(),
			body: JSON.stringify({ passwordCurrent, password, passwordConfirm }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to update password");
		}

		const result = await response.json();

		// Update token if password change is successful
		if (result.status === "success" && result.token) {
			localStorage.setItem("userToken", result.token);
		}

		return result;
	} catch (error) {
		console.error("❌ Failed to update password:", error);
		throw error;
	}
};

// Forgot Password for regular users
export const userForgotPassword = async (email) => {
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
		console.error("❌ User forgot password failed:", error);
		throw error;
	}
};

// User Logout
export const userLogout = () => {
	localStorage.removeItem("userToken");
	// Dispatch custom event to notify components of logout
	window.dispatchEvent(new Event("userLogout"));
};

// Check if user is logged in
export const isUserLoggedIn = () => {
	const token = localStorage.getItem("userToken");
	if (!token) {
		console.log("No token found");
		return false;
	}

	console.log("Token found:", token.substring(0, 20) + "...");

	// Basic token validation - check if it's not expired
	try {
		const tokenPayload = JSON.parse(atob(token.split(".")[1]));
		const currentTime = Date.now() / 1000;

		console.log("Token payload:", tokenPayload);
		console.log("Token exp:", tokenPayload.exp, "Current time:", currentTime);

		if (tokenPayload.exp && tokenPayload.exp < currentTime) {
			// Token is expired, remove it
			console.log("Token expired, removing");
			localStorage.removeItem("userToken");
			return false;
		}

		console.log("Token is valid");
		return true;
	} catch {
		// If token is malformed, remove it
		console.log("Token malformed, removing");
		localStorage.removeItem("userToken");
		return false;
	}
};

// Get stored user token
export const getStoredUserToken = () => {
	return localStorage.getItem("userToken");
};

// Get auth headers for API requests
export const getUserAuthHeaders = () => {
	const token = localStorage.getItem("userToken");
	return token
		? {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
		  }
		: {
				"Content-Type": "application/json",
		  };
};

// Update user upload statistics
export const updateUploadStats = async (userId, type) => {
	try {
		const response = await fetch(`${API_BASE_URL}/updateUploadStats`, {
			method: "PATCH",
			headers: getUserAuthHeaders(),
			body: JSON.stringify({ userId, type }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to update upload stats");
		}

		return await response.json();
	} catch (error) {
		console.error("❌ Update upload stats failed:", error);
		throw error;
	}
};

// Sync all users' upload statistics (admin only)
export const syncUserStats = async () => {
	try {
		const response = await fetch(`${API_BASE_URL}/sync-user-stats`, {
			method: "POST",
			headers: getUserAuthHeaders(),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to sync user stats");
		}

		return await response.json();
	} catch (error) {
		console.error("❌ Sync user stats failed:", error);
		throw error;
	}
};
