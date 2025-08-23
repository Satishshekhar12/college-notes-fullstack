import nodemailer from "nodemailer";

// Create Gmail transporter
const createGmailTransporter = () => {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.GMAIL_USER,
			pass: process.env.GMAIL_PASS,
		},
	});
};

// Send contact form email
export const sendContactEmail = async (contactData) => {
	const { name, email, message } = contactData;

	const transporter = createGmailTransporter();

	// Email to you (the admin)
	const adminMailOptions = {
		from: process.env.GMAIL_USER,
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
		from: process.env.GMAIL_USER,
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
			transporter.sendMail(adminMailOptions),
			transporter.sendMail(confirmationMailOptions),
		]);

		return {
			success: true,
			message:
				"Contact form submitted successfully! Check your email for confirmation.",
		};
	} catch (error) {
		console.error("Gmail sending error:", error);
		throw new Error("Failed to send email. Please try again later.");
	}
};

export default { sendContactEmail };
