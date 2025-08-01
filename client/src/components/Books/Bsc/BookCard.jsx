import React from "react";

const BookCard = ({ book }) => {
	const handleView = (e) => {
		e.preventDefault();
		// Open secure viewer instead of download
		openSecureViewer(book);
	};

	// DOWNLOAD FUNCTIONALITY - CURRENTLY DISABLED
	// Uncomment the function below to enable downloads
	/*
	const handleDownload = (e) => {
		e.preventDefault();
		// Actual download functionality would go here
		alert(`Download functionality for "${book.title}" will be implemented soon!`);
	};
	*/

	const openSecureViewer = (book) => {
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
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
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
		bookIcon.innerHTML = "📚";
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
			<h4 style="font-size: 20px; font-weight: 600; color: #374151; margin-bottom: 12px;">${
				book.title
			}</h4>
			<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Author:</strong> ${
				book.author
			}</p>
			${
				book.edition
					? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Edition:</strong> ${book.edition}</p>`
					: ""
			}
			${
				book.year
					? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 16px;"><strong>Year:</strong> ${book.year}</p>`
					: ""
			}
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

	return (
		<div className="relative overflow-hidden border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500 group">
			{/* Top gradient bar that appears on hover */}
			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-teal-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></div>

			<h5 className="text-gray-800 text-lg font-semibold leading-snug mb-4 line-clamp-2 overflow-hidden">
				{book.title}
			</h5>

			<p className="text-gray-600 text-sm leading-relaxed mb-3">
				<span className="font-semibold text-teal-500 mr-2">Author:</span>
				{book.author}
			</p>

			{book.edition && (
				<p className="text-gray-600 text-sm leading-relaxed mb-3">
					<span className="font-semibold text-teal-500 mr-2">Edition:</span>
					{book.edition}
				</p>
			)}

			{book.year && (
				<p className="text-gray-600 text-sm leading-relaxed mb-3">
					<span className="font-semibold text-teal-500 mr-2">Year:</span>
					{book.year}
				</p>
			)}

			<button
				onClick={handleView}
				className="w-full bg-gradient-to-br from-blue-500 to-blue-400 text-white border-none py-3 px-5 rounded-lg cursor-pointer text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 mt-4 hover:from-blue-600 hover:to-blue-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30 active:translate-y-0"
			>
				<span className="text-lg">👁️</span>
				View Only
			</button>
			{/* DOWNLOAD BUTTON - CURRENTLY DISABLED */}
			{/* Uncomment below to enable downloads */}
			{/*
			<button
				onClick={handleDownload}
				className="w-full bg-gradient-to-br from-teal-500 to-teal-400 text-white border-none py-3 px-5 rounded-lg cursor-pointer text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 mt-4 hover:from-teal-600 hover:to-teal-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30 active:translate-y-0"
			>
				<span className="text-lg">📥</span>
				Download
			</button>
			*/}
		</div>
	);
};

export default BookCard;
