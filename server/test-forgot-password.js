import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const testForgotPassword = async () => {
	try {
		console.log("🧪 Testing Forgot Password API...");

		const response = await fetch(
			"http://localhost:5000/api/auth/forgot-password",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: "notes.helper0@gmail.com", // Using your email for testing
				}),
			}
		);

		const data = await response.json();

		if (response.ok) {
			console.log("✅ Forgot Password Test Successful!");
			console.log("📧 Response:", data.message);
		} else {
			console.log("❌ Forgot Password Test Failed!");
			console.log("🔴 Error:", data.message);
		}
	} catch (error) {
		console.error("💥 Test Error:", error.message);
	}
};

testForgotPassword();
