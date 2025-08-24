import nodemailer from "nodemailer";

// Validate required envs once
const requireEnv = (name) => {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return v;
};

// Create a robust Gmail transporter with fallback between 465 and 587
const createTransport = (opts) =>
	nodemailer.createTransport({
		pool: true,
		...opts,
		auth: {
			user: requireEnv("GMAIL_USER"),
			pass: requireEnv("GMAIL_PASS"),
		},
		// Reasonable timeouts to avoid hanging in PaaS
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 15_000,
	});

const getGmailTransporter = async () => {
	// Try SSL first (465), then TLS upgrade (587)
	const configs = [
		{
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			tls: { servername: "smtp.gmail.com" },
		},
		{
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			tls: { ciphers: "TLSv1.2", servername: "smtp.gmail.com" },
		},
	];
	let lastErr;
	for (const cfg of configs) {
		const transporter = createTransport(cfg);
		try {
			await transporter.verify();
			return transporter;
		} catch (err) {
			lastErr = err;
		}
	}
	const maskedUser = (process.env.GMAIL_USER || "").replace(
		/(.{2}).+(@.*)/,
		"$1***$2"
	);
	const err = new Error(
		`SMTP connect failed for ${maskedUser}. Ensure App Password is valid and outbound SMTP to ports 465/587 is allowed.`
	);
	err.cause = lastErr;
	throw err;
};

// Generic send helper
export const sendMail = async ({ to, subject, html, text, replyTo }) => {
	const transporter = await getGmailTransporter();
	const from = requireEnv("GMAIL_USER");
	return transporter.sendMail({ from, to, subject, html, text, replyTo });
};

// Send contact form email
export const sendContactEmail = async (contactData) => {
	const { name, email, message } = contactData;

	// Email to you (the admin)
	const adminMailOptions = {
		to: process.env.GMAIL_USER, // Send to yourself
		subject: `New Contact Form Message from ${name}`,
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #1F9FA3; border-bottom: 2px solid #62BDBD; padding-bottom: 10px;">
					📩 New Contact Form Message
				</h2>
				
				<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
					<h3 style="color: #333; margin: 0 0 15px 0;">Contact Details:</h3>
					<p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
					<p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #1F9FA3;">${email}</a></p>
				</div>
				
				<div style="background: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
					<h3 style="color: #333; margin: 0 0 15px 0;">Message:</h3>
					<p style="line-height: 1.6; color: #555; white-space: pre-wrap;">${message}</p>
				</div>
				
				<div style="margin-top: 20px; padding: 15px; background: #e8f5f5; border-radius: 5px;">
					<p style="margin: 0; color: #666; font-size: 14px;">
						<strong>📧 Quick Reply:</strong> Simply reply to this email to respond directly to ${name} at ${email}
					</p>
				</div>
				
				<footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
					<p>This message was sent from the College Notes contact form</p>
					<p>College Notes Platform | notes.helper0@gmail.com</p>
				</footer>
			</div>
		`,
		replyTo: email, // This allows you to reply directly to the sender
	};

	// Confirmation email to the sender
	const confirmationMailOptions = {
		to: email,
		subject: "Thank you for contacting College Notes!",
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #1F9FA3; border-bottom: 2px solid #62BDBD; padding-bottom: 10px;">
					🎉 Thank you for reaching out!
				</h2>
				
				<p style="font-size: 16px; color: #333; line-height: 1.6;">
					Hi <strong>${name}</strong>,
				</p>
				
				<p style="color: #555; line-height: 1.6;">
					Thank you for contacting College Notes! We have received your message and will get back to you as soon as possible.
				</p>
				
				<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
					<h3 style="color: #333; margin: 0 0 10px 0;">📝 Your Message:</h3>
					<p style="color: #666; font-style: italic; line-height: 1.6; white-space: pre-wrap;">"${message}"</p>
				</div>
				
				<div style="background: #e8f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
					<h3 style="color: #1F9FA3; margin: 0 0 10px 0;">⏰ What's Next?</h3>
					<ul style="color: #555; line-height: 1.8; margin: 0; padding-left: 20px;">
						<li>We typically respond within 24 hours during business days</li>
						<li>You'll receive a response from our team at notes.helper0@gmail.com</li>
						<li>For urgent matters, feel free to connect with us on LinkedIn</li>
					</ul>
				</div>
				
				<div style="text-align: center; margin: 30px 0;">
					<a href="https://www.linkedin.com/in/satishshekhar/" target="_blank" style="display: inline-block; background: #1F9FA3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
						🔗 Connect on LinkedIn
					</a>
				</div>
				
				<footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
					<p>College Notes Platform | Helping students succeed</p>
					<p>This is an automated confirmation email</p>
				</footer>
			</div>
		`,
	};

	try {
		// Send both emails
		await Promise.all([
			sendMail(adminMailOptions),
			sendMail(confirmationMailOptions),
		]);

		return {
			success: true,
			message:
				"Contact form submitted successfully! Check your email for confirmation.",
		};
	} catch (error) {
		const code = error?.code || error?.responseCode;
		const msg = error?.message || "Unknown error";
		console.error("Gmail sending error (contact):", code, msg);
		throw new Error("Failed to send email. Please try again later.");
	}
};

// Password reset email (reusable across controllers)
export const sendPasswordResetEmail = async ({ to, resetURL, userName }) => {
	const subject = "🔒 Password Reset Request - College Notes";
	const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="text-align: center; margin-bottom: 30px;">
				<h1 style="color: #1F9FA3; font-size: 28px; margin: 0;">🔒 Password Reset</h1>
				<p style="color: #666; font-size: 16px; margin: 10px 0;">College Notes Platform</p>
			</div>
			<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
				<h2 style="color: #333; margin: 0 0 15px 0;">Hi ${userName || "there"},</h2>
				<p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">We received a request to reset your password for your College Notes account.</p>
				<p style="color: #555; line-height: 1.6; margin: 0;">Click the button below to reset your password. This link will expire in 10 minutes.</p>
			</div>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${resetURL}" style="display: inline-block; background: linear-gradient(135deg, #62BDBD, #1F9FA3); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(31, 159, 163, 0.3);">🔄 Reset My Password</a>
			</div>
			<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
				<p style="color: #856404; margin: 0; font-size: 14px;"><strong>⚠️ Security Notice:</strong><br>• This link expires in 10 minutes<br>• If you didn't request this reset, please ignore this email<br>• Your password will remain unchanged until you click the link above</p>
			</div>
			<div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
				<p style="color: #999; font-size: 12px; margin: 0;">If the button doesn't work, copy and paste this link into your browser:<br>
				<a href="${resetURL}" style="color: #1F9FA3; word-break: break-all;">${resetURL}</a></p>
				<p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">College Notes Platform | Secure Password Reset</p>
			</div>
		</div>`;
	try {
		await sendMail({ to, subject, html });
	} catch (error) {
		const code = error?.code || error?.responseCode;
		const msg = error?.message || "Unknown error";
		console.error("Gmail sending error (reset):", code, msg);
		throw error;
	}
};

export default { sendContactEmail, sendMail, sendPasswordResetEmail };
