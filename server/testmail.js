import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log("Testing email configuration...");
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log(
	"GMAIL_PASS:",
	process.env.GMAIL_PASS ? "***configured***" : "NOT SET"
);

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.GMAIL_USER,
		pass: process.env.GMAIL_PASS,
	},
});

console.log("Attempting SMTP connection...");

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
	console.log("❌ Connection timeout after 10 seconds");
	process.exit(1);
}, 10000);

// Test the connection first
transporter.verify((error, success) => {
	clearTimeout(timeout);

	if (error) {
		console.error("❌ SMTP connection failed:", error.message);
		console.log("\n💡 Troubleshooting tips:");
		console.log(
			"1. Make sure you're using the App Password, not your regular Gmail password"
		);
		console.log(
			"2. App password should be 16 characters without spaces: lmeyklpwzgpzrgwi"
		);
		console.log(
			"3. Ensure 2-Factor Authentication is enabled on your Gmail account"
		);
		process.exit(1);
	} else {
		console.log("✅ SMTP connection successful!");

		// Send test email
		transporter.sendMail(
			{
				from: process.env.GMAIL_USER,
				to: process.env.GMAIL_USER,
				subject: "Test Email - College Notes App",
				text: "This is a test email from Nodemailer. Your email configuration is working!",
				html: "<h3>🎉 Test Email Success!</h3><p>Your email configuration is working correctly.</p>",
			},
			(err, info) => {
				if (err) {
					console.error("❌ Email sending failed:", err.message);
				} else {
					console.log("✅ Email sent successfully!");
					console.log("📧 Message ID:", info.messageId);
					console.log("📨 Response:", info.response);
				}
				process.exit(0);
			}
		);
	}
});
