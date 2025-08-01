import React from "react";

const BooksList = ({ courseId }) => {
	const openSecureBookViewer = (book) => {
		// Create modal overlay
		const modal = document.createElement("div");
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			z-index: 10000;
			display: flex;
			align-items: center;
			justify-content: center;
		`;

		// Create modal content
		const modalContent = document.createElement("div");
		modalContent.style.cssText = `
			width: 90%;
			height: 90%;
			max-width: 800px;
			background: white;
			border-radius: 8px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		`;

		// Create header with close button
		const header = document.createElement("div");
		header.style.cssText = `
			padding: 16px 24px;
			border-bottom: 1px solid #e5e7eb;
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #f9fafb;
			border-radius: 8px 8px 0 0;
		`;

		const title = document.createElement("h3");
		title.textContent = book.title;
		title.style.cssText = `
			margin: 0;
			font-size: 18px;
			font-weight: 600;
			color: #374151;
		`;

		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = "✕";
		closeBtn.style.cssText = `
			background: none;
			border: none;
			font-size: 24px;
			cursor: pointer;
			color: #6b7280;
		`;

		// Create content area
		const content = document.createElement("div");
		content.style.cssText = `
			flex: 1;
			padding: 24px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			background: #f3f4f6;
		`;

		const bookIcon = document.createElement("div");
		bookIcon.innerHTML = book.icon || "📚";
		bookIcon.style.cssText = `
			font-size: 64px;
			margin-bottom: 16px;
		`;

		const bookInfo = document.createElement("div");
		bookInfo.style.cssText = `
			text-align: center;
			max-width: 500px;
		`;

		bookInfo.innerHTML = `
			<h4 style="font-size: 20px; font-weight: 600; color: #374151; margin-bottom: 12px;">${book.title}</h4>
			<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Author:</strong> ${book.author}</p>
			<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>ISBN:</strong> ${book.isbn}</p>
			<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Category:</strong> ${book.category}</p>
			<p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">${book.description}</p>
			<p style="font-size: 14px; color: #9ca3af; font-style: italic;">Book content would be displayed here in a secure reader</p>
		`;

		// Close modal function
		const closeModal = () => {
			document.body.removeChild(modal);
			document.body.style.overflow = "auto";
		};

		// Event listeners
		closeBtn.onclick = closeModal;
		modal.onclick = (e) => {
			if (e.target === modal) closeModal();
		};

		// Prevent page scrolling when modal is open
		document.body.style.overflow = "hidden";

		// Assemble modal
		header.appendChild(title);
		header.appendChild(closeBtn);
		content.appendChild(bookIcon);
		content.appendChild(bookInfo);
		modalContent.appendChild(header);
		modalContent.appendChild(content);
		modal.appendChild(modalContent);
		document.body.appendChild(modal);

		// Add keyboard navigation
		document.addEventListener("keydown", function escHandler(e) {
			if (e.key === "Escape") {
				closeModal();
				document.removeEventListener("keydown", escHandler);
			}
		});
	};

	// Course-specific books based on courseId
	const getCourseBooksData = () => {
		const booksDatabase = {
			botany: [
				{
					title: "Plant Biology and Botany",
					author: "Dr. A.K. Singh",
					isbn: "978-81-203-3456-7",
					description:
						"Comprehensive guide to plant biology and botanical studies",
					link: "https://example.com/botany-book1",
					icon: "🌱",
					category: "Core Textbook",
				},
				{
					title: "Plant Physiology",
					author: "Prof. R.K. Sharma",
					isbn: "978-81-203-3457-8",
					description: "Advanced concepts in plant physiology",
					link: "https://example.com/botany-book2",
					icon: "🌿",
					category: "Reference",
				},
				{
					title: "Plant Taxonomy",
					author: "Dr. S.N. Pandey",
					isbn: "978-81-203-3458-9",
					description: "Classification and identification of plants",
					link: "https://example.com/botany-book3",
					icon: "🍃",
					category: "Supplementary",
				},
			],
			chemistry: [
				{
					title: "Organic Chemistry",
					author: "Dr. P.K. Verma",
					isbn: "978-81-203-4456-7",
					description: "Fundamentals of organic chemistry",
					link: "https://example.com/chemistry-book1",
					icon: "⚗️",
					category: "Core Textbook",
				},
				{
					title: "Physical Chemistry",
					author: "Prof. M.L. Gupta",
					isbn: "978-81-203-4457-8",
					description: "Physical chemistry principles and applications",
					link: "https://example.com/chemistry-book2",
					icon: "🧪",
					category: "Core Textbook",
				},
				{
					title: "Inorganic Chemistry",
					author: "Dr. R.S. Singh",
					isbn: "978-81-203-4458-9",
					description: "Comprehensive inorganic chemistry",
					link: "https://example.com/chemistry-book3",
					icon: "🔬",
					category: "Reference",
				},
			],
			physics: [
				{
					title: "Classical Mechanics",
					author: "Dr. H.C. Verma",
					isbn: "978-81-203-5456-7",
					description: "Fundamentals of classical mechanics",
					link: "https://example.com/physics-book1",
					icon: "⚛️",
					category: "Core Textbook",
				},
				{
					title: "Electricity and Magnetism",
					author: "Prof. D.C. Tayal",
					isbn: "978-81-203-5457-8",
					description: "Electromagnetic theory and applications",
					link: "https://example.com/physics-book2",
					icon: "⚡",
					category: "Core Textbook",
				},
				{
					title: "Modern Physics",
					author: "Dr. A.B. Gupta",
					isbn: "978-81-203-5458-9",
					description: "Quantum mechanics and relativity",
					link: "https://example.com/physics-book3",
					icon: "🌌",
					category: "Advanced",
				},
			],
			maths: [
				{
					title: "Calculus and Analytical Geometry",
					author: "Dr. R.D. Sharma",
					isbn: "978-81-203-6456-7",
					description: "Advanced calculus and geometry",
					link: "https://example.com/math-book1",
					icon: "📐",
					category: "Core Textbook",
				},
				{
					title: "Linear Algebra",
					author: "Prof. S.K. Mapa",
					isbn: "978-81-203-6457-8",
					description: "Matrix theory and linear transformations",
					link: "https://example.com/math-book2",
					icon: "📊",
					category: "Core Textbook",
				},
				{
					title: "Differential Equations",
					author: "Dr. M.D. Raisinghania",
					isbn: "978-81-203-6458-9",
					description: "Ordinary and partial differential equations",
					link: "https://example.com/math-book3",
					icon: "∂",
					category: "Advanced",
				},
			],
		};

		return (
			booksDatabase[courseId] || [
				{
					title: "General Science Textbook",
					author: "Dr. Academic Author",
					isbn: "978-81-203-0000-0",
					description: "General science reference book",
					link: "https://example.com/general-book",
					icon: "📚",
					category: "General",
				},
			]
		);
	};

	const books = getCourseBooksData();

	const getCategoryColor = (category) => {
		const colors = {
			"Core Textbook": "bg-blue-100 text-blue-800",
			Reference: "bg-green-100 text-green-800",
			Supplementary: "bg-yellow-100 text-yellow-800",
			Advanced: "bg-purple-100 text-purple-800",
			General: "bg-gray-100 text-gray-800",
		};
		return colors[category] || colors["General"];
	};

	return (
		<div>
			<h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
				📚 Books & Resources for{" "}
				{courseId.charAt(0).toUpperCase() + courseId.slice(1)}
			</h3>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{books.map((book, index) => (
					<div
						key={index}
						className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
					>
						<div className="flex items-start mb-4">
							<div className="text-4xl mr-4">{book.icon}</div>
							<div className="flex-1">
								<h4 className="font-bold text-gray-800 mb-2 line-clamp-2">
									{book.title}
								</h4>
								<p className="text-sm text-gray-600 mb-2">by {book.author}</p>
								<span
									className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(
										book.category
									)}`}
								>
									{book.category}
								</span>
							</div>
						</div>

						<p className="text-sm text-gray-600 mb-4 line-clamp-3">
							{book.description}
						</p>

						<div className="text-xs text-gray-500 mb-4">ISBN: {book.isbn}</div>

						<div className="flex space-x-2">
							<button
								onClick={() => openSecureBookViewer(book)}
								className="w-full inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 bg-white border border-blue-300 rounded-md px-3 py-2 hover:bg-blue-50 transition-colors"
							>
								<span>�️ View Only</span>
							</button>
							{/* DOWNLOAD BUTTON - CURRENTLY DISABLED */}
							{/* Uncomment below to enable downloads */}
							{/*
							<button className="inline-flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-800 bg-white border border-green-300 rounded-md px-3 py-2 hover:bg-green-50 transition-colors">
								⬇️ Download
							</button>
							*/}
						</div>
					</div>
				))}
			</div>

			{/* Additional Resources Section */}
			<div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
				<h4 className="text-lg font-semibold text-gray-800 mb-4">
					🔗 Additional Resources
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex items-center space-x-3 p-3 bg-white rounded-md">
						<span className="text-2xl">🌐</span>
						<div>
							<p className="font-medium text-gray-800">Online Library</p>
							<p className="text-sm text-gray-600">Access digital resources</p>
						</div>
					</div>
					<div className="flex items-center space-x-3 p-3 bg-white rounded-md">
						<span className="text-2xl">📝</span>
						<div>
							<p className="font-medium text-gray-800">Research Papers</p>
							<p className="text-sm text-gray-600">
								Latest academic publications
							</p>
						</div>
					</div>
					<div className="flex items-center space-x-3 p-3 bg-white rounded-md">
						<span className="text-2xl">🎥</span>
						<div>
							<p className="font-medium text-gray-800">Video Lectures</p>
							<p className="text-sm text-gray-600">Educational video content</p>
						</div>
					</div>
					<div className="flex items-center space-x-3 p-3 bg-white rounded-md">
						<span className="text-2xl">🧪</span>
						<div>
							<p className="font-medium text-gray-800">Lab Manuals</p>
							<p className="text-sm text-gray-600">
								Practical experiment guides
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BooksList;
