import { API_BASE_URL } from "../config/api";

// User Authentication (for regular users, not admin)
export const userLogin = async (identifier, password) => {
	try {
		const response = await fetch(`${API_BASE_URL}/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ identifier, password }),
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
		const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
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

// Begin Google OAuth flow
export const startGoogleLogin = () => {
	window.location.href = `${API_BASE_URL}/api/auth/google`;
};

// Exchange httpOnly cookie for token (used on /dashboard)
export const exchangeCookieForToken = async () => {
	try {
		const res = await fetch(`${API_BASE_URL}/api/auth/token`, {
			credentials: "include",
		});
		const data = await res.json();
		if (res.ok && data.status === "success" && data.token) {
			// Always store user token
			localStorage.setItem("userToken", data.token);

			// Store user object if provided
			if (data.user) {
				try {
					localStorage.setItem("user", JSON.stringify(data.user));
				} catch (e) {
					console.warn("⚠️ Failed to store user object:", e);
				}
			}

			// If this Google-authenticated user has admin privileges, also seed admin storage
			const role = data?.user?.role;
			if (["admin", "moderator", "senior moderator"].includes(role)) {
				console.log(
					"✅ User has admin privileges (",
					role,
					") — seeding admin storage"
				);
				localStorage.setItem("adminToken", data.token);
				localStorage.setItem("adminUser", JSON.stringify(data.user));
				// Let listeners (e.g., Admin page or Navbar) know
				window.dispatchEvent(new Event("adminLogin"));
			}

			// Notify regular user login listeners
			window.dispatchEvent(new Event("userLogin"));
			return true;
		}
		return false;
	} catch (error) {
		console.error("❌ Cookie exchange error:", error);
		return false;
	}
}; // Check if user is logged in
export const isUserLoggedIn = () => {
	const token = localStorage.getItem("userToken");
	if (!token) {
		return false;
	}

	// Basic token validation - check if it's not expired
	try {
		const tokenPayload = JSON.parse(atob(token.split(".")[1]));
		const currentTime = Date.now() / 1000;

		if (tokenPayload.exp && tokenPayload.exp < currentTime) {
			// Token is expired, remove it
			localStorage.removeItem("userToken");
			return false;
		}

		return true;
	} catch {
		// If token is malformed, remove it
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

// Set initial password for Google-auth users (no current password)
export const setInitialPassword = async (password, passwordConfirm) => {
	try {
		const response = await fetch(`${API_BASE_URL}/setInitialPassword`, {
			method: "PATCH",
			headers: getUserAuthHeaders(),
			body: JSON.stringify({ password, passwordConfirm }),
		});
		const result = await response.json();
		if (!response.ok)
			throw new Error(result.message || "Failed to set password");
		if (result?.token) localStorage.setItem("userToken", result.token);
		return result;
	} catch (error) {
		console.error("❌ Set initial password failed:", error);
		throw error;
	}
};

// Update username
export const updateUsername = async (username) => {
	try {
		const response = await fetch(`${API_BASE_URL}/updateMe`, {
			method: "PATCH",
			headers: getUserAuthHeaders(),
			body: JSON.stringify({ username }),
		});
		const result = await response.json();
		if (!response.ok)
			throw new Error(result.message || "Failed to update username");
		return result;
	} catch (error) {
		console.error("❌ Update username failed:", error);
		throw error;
	}
};

// Start Google re-auth flow (to verify identity for password reset)
// Note: Google re-auth flow removed; Google-linked users can change password directly
