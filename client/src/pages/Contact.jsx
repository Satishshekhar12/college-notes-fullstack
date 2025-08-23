import React, { useState } from "react";

const Contact = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		message: "",
	});

	const [formStatus, setFormStatus] = useState({
		isSubmitting: false,
		isSubmitted: false,
		error: null,
	});

	const [errors, setErrors] = useState({});

	const validateForm = () => {
		const newErrors = {};

		// Validate name
		if (!formData.name.trim()) {
			newErrors.name = "Name is required";
		} else if (formData.name.trim().length < 2) {
			newErrors.name = "Name must be at least 2 characters";
		}

		// Validate email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!emailRegex.test(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}

		// Validate message
		if (!formData.message.trim()) {
			newErrors.message = "Message is required";
		} else if (formData.message.trim().length < 10) {
			newErrors.message = "Message must be at least 10 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error for this field when user starts typing
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	const sendEmail = async (formData) => {
		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name,
					email: formData.email,
					message: formData.message,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Failed to send message");
			}

			return {
				status: "success",
				message: data.message || "Message sent successfully!",
			};
		} catch (error) {
			console.error("Contact form submission error:", error);
			throw new Error(
				error.message || "Failed to send message. Please try again later."
			);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validate form
		if (!validateForm()) {
			return;
		}

		setFormStatus({ isSubmitting: true, isSubmitted: false, error: null });

		try {
			await sendEmail(formData);

			// Success
			setFormStatus({
				isSubmitting: false,
				isSubmitted: true,
				error: null,
			});

			// Reset form
			setFormData({ name: "", email: "", message: "" });
			setErrors({});

			// Auto-hide success message after 5 seconds
			setTimeout(() => {
				setFormStatus((prev) => ({ ...prev, isSubmitted: false }));
			}, 5000);
		} catch (error) {
			setFormStatus({
				isSubmitting: false,
				isSubmitted: false,
				error: error.message,
			});
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 px-4">
			<div className="max-w-6xl mx-auto">
				<div className="bg-white rounded-2xl shadow-xl overflow-hidden">
					<div className="p-8 text-center bg-gradient-to-r from-[#62BDBD] to-[#1F9FA3]">
						<h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
						<p className="text-blue-100 text-lg max-w-2xl mx-auto">
							We'd love to hear from you. Send us a message and we'll respond as
							soon as possible.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
						{/* Contact Information */}
						<div className="space-y-6">
							<h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
								<span className="text-3xl">📞</span>
								Contact Information
							</h2>

							<div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-shadow">
								<div className="flex items-start gap-4">
									<div className="bg-blue-100 p-3 rounded-full text-2xl">
										📧
									</div>
									<div>
										<h3 className="font-semibold text-gray-800 text-lg mb-2">
											Email
										</h3>
										<a
											href="mailto:notes.helper0@gmail.com"
											className="text-blue-600 hover:text-purple-600 transition-colors text-lg font-medium"
										>
											notes.helper0@gmail.com
										</a>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100 hover:shadow-lg transition-shadow">
								<div className="flex items-start gap-4">
									<div className="bg-purple-100 p-3 rounded-full text-2xl">
										💼
									</div>
									<div>
										<h3 className="font-semibold text-gray-800 text-lg mb-2">
											LinkedIn
										</h3>
										<a
											href="https://www.linkedin.com/in/satishshekhar/"
											target="_blank"
											rel="noopener noreferrer"
											className="text-purple-600 hover:text-blue-600 transition-colors text-lg font-medium"
										>
											Connect with Satish Shekhar
										</a>
									</div>
								</div>
							</div>

							{/* Additional Contact Methods */}
							<div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
								<h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
									<span className="text-2xl">⏰</span>
									Response Time
								</h3>
								<p className="text-gray-600">
									We typically respond within 24 hours during business days.
								</p>
							</div>
						</div>

						{/* Contact Form */}
						<div className="space-y-6">
							<h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
								<span className="text-3xl">💬</span>
								Send us a Message
							</h2>

							{/* Success Message */}
							{formStatus.isSubmitted && (
								<div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
									<span className="text-green-500 text-xl">✅</span>
									<div>
										<p className="text-green-800 font-medium mb-2">
											Thank you! Your message has been sent successfully.
										</p>
										<p className="text-green-700 text-sm">
											📧 You'll receive a confirmation email shortly, and we'll
											get back to you within 24 hours!
										</p>
									</div>
								</div>
							)}

							{/* Error Message */}
							{formStatus.error && (
								<div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
									<span className="text-red-500 text-xl">❌</span>
									<p className="text-red-800 font-medium">{formStatus.error}</p>
								</div>
							)}

							<form onSubmit={handleSubmit} className="space-y-6">
								<div>
									<label
										htmlFor="name"
										className="block text-sm font-semibold text-gray-700 mb-2"
									>
										Your Name *
									</label>
									<input
										type="text"
										id="name"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
											errors.name
												? "border-red-300 bg-red-50"
												: "border-gray-200 hover:border-gray-300"
										}`}
										placeholder="Enter your full name"
										disabled={formStatus.isSubmitting}
									/>
									{errors.name && (
										<span className="text-red-500 text-sm mt-1 block">
											{errors.name}
										</span>
									)}
								</div>

								<div>
									<label
										htmlFor="email"
										className="block text-sm font-semibold text-gray-700 mb-2"
									>
										Email Address *
									</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
											errors.email
												? "border-red-300 bg-red-50"
												: "border-gray-200 hover:border-gray-300"
										}`}
										placeholder="Enter your email address"
										disabled={formStatus.isSubmitting}
									/>
									{errors.email && (
										<span className="text-red-500 text-sm mt-1 block">
											{errors.email}
										</span>
									)}
								</div>

								<div>
									<label
										htmlFor="message"
										className="block text-sm font-semibold text-gray-700 mb-2"
									>
										Message *
									</label>
									<textarea
										id="message"
										name="message"
										value={formData.message}
										onChange={handleInputChange}
										className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
											errors.message
												? "border-red-300 bg-red-50"
												: "border-gray-200 hover:border-gray-300"
										}`}
										placeholder="Tell us how we can help you..."
										rows="5"
										disabled={formStatus.isSubmitting}
									></textarea>
									{errors.message && (
										<span className="text-red-500 text-sm mt-1 block">
											{errors.message}
										</span>
									)}
								</div>

								<button
									type="submit"
									className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
										formStatus.isSubmitting
											? "bg-gray-400 cursor-not-allowed"
											: "bg-gradient-to-r from-[#62BDBD] to-[#1F9FA3] hover:from-[#5AA9A9] hover:to-[#1A8C8F] transform hover:scale-105 shadow-lg hover:shadow-xl"
									}`}
									disabled={formStatus.isSubmitting}
								>
									{formStatus.isSubmitting ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
											Sending...
										</>
									) : (
										<>
											<span className="text-xl">📨</span>
											Send Message
										</>
									)}
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Contact;
