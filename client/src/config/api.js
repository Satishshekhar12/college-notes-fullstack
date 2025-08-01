// API Configuration
const isDevelopment = import.meta.env.DEV;
const productionApiUrl = "https://college-notes-fullstack.onrender.com";
// import.meta.env.VITE_API_BASE_URL || "https://your-render-app.onrender.com";
const developmentApiUrl = "http://localhost:5000";

export const API_BASE_URL = isDevelopment
	? developmentApiUrl
	: productionApiUrl;

// API Endpoints
export const API_ENDPOINTS = {
	UPLOAD: "/api/upload",
	FILES: "/api/files",
	PRESIGNED_URL: "/api/presigned-url",
	FILES_CATEGORY: "/api/files/category",
};

// Default configuration
export const API_CONFIG = {
	timeout: 30000, // 30 seconds
	headers: {
		"Content-Type": "application/json",
	},
};
