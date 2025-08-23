import express from "express";
import { sendContactEmail } from "../utils/gmailService.js";

const router = express.Router();

// Contact form submission
router.post("/contact", async (req, res) => {
	try {
		const { name, email, message } = req.body;

		// Validation
		if (!name || !email || !message) {
			return res.status(400).json({
				success: false,
				message: "All fields (name, email, message) are required",
			});
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Please provide a valid email address",
			});
		}

		// Length validations
		if (name.trim().length < 2) {
			return res.status(400).json({
				success: false,
				message: "Name must be at least 2 characters long",
			});
		}

		if (message.trim().length < 10) {
			return res.status(400).json({
				success: false,
				message: "Message must be at least 10 characters long",
			});
		}

		// Send email
		const result = await sendContactEmail({
			name: name.trim(),
			email: email.trim(),
			message: message.trim(),
		});

		res.status(200).json({
			success: true,
			message: result.message,
		});
	} catch (error) {
		console.error("Contact form error:", error);
		res.status(500).json({
			success: false,
			message:
				error.message || "Failed to send message. Please try again later.",
		});
	}
});

export default router;
