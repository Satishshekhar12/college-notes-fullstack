import React from "react";

const SecureViewer = {
	/**
	 * Determines if a file type can be viewed inline in an iframe
	 * @param {string} fileName - The name of the file
	 * @returns {boolean} - Whether the file can be viewed inline
	 */
	canViewInline: (fileName) => {
		const extension = fileName.split(".").pop()?.toLowerCase();
		const inlineViewableTypes = ["pdf", "txt", "jpg", "jpeg", "png"];

		// Check if it's a directly viewable type
		if (inlineViewableTypes.includes(extension)) {
			return true;
		}

		// For PowerPoint files, check if browser supports viewing
		if (["ppt", "pptx"].includes(extension)) {
			// Modern browsers can attempt to view these via Google Docs viewer or native support
			return true;
		}

		// For Word documents, similar approach
		if (["doc", "docx"].includes(extension)) {
			return true;
		}

		return false;
	},

	/**
	 * Gets appropriate iframe source URL for different file types
	 * @param {string} url - Original file URL
	 * @param {string} fileName - File name for type detection
	 * @returns {string} - Modified URL for viewing
	 */
	getViewerUrl: (url, fileName) => {
		const extension = fileName.split(".").pop()?.toLowerCase();

		// For PowerPoint files, use Google Docs viewer which can render PPT/PPTX
		if (["ppt", "pptx"].includes(extension)) {
			// Google Docs viewer works well for PowerPoint files
			return `https://docs.google.com/viewer?url=${encodeURIComponent(
				url
			)}&embedded=true`;
		}

		// For Word documents, also use Google Docs viewer
		if (["doc", "docx"].includes(extension)) {
			return `https://docs.google.com/viewer?url=${encodeURIComponent(
				url
			)}&embedded=true`;
		}

		// For other file types, use direct URL
		return url;
	},

	/**
	 * Opens a secure viewer modal for PDFs and other files
	 * @param {string} url - The URL of the file to view
	 * @param {string} fileName - The name of the file
	 * @param {Object} options - Additional options for customization
	 */
	openFileViewer: (url, fileName, options = {}) => {
		const {
			width = "100vw", // Full screen width for iframe
			height = "100vh", // Full screen height for iframe
			maxWidth = "100vw", // Ensure iframe takes full width
			maxHeight = "100vh", // Ensure iframe takes full height
			backgroundColor = "rgba(0, 0, 0, 0.9)",
		} = options;

		// Create modal overlay
		const modal = document.createElement("div");
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: ${backgroundColor};
			z-index: 99999;
			display: flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: blur(4px);
		`;

		// Create modal content
		const modalContent = document.createElement("div");
		modalContent.style.cssText = `
			width: ${width};
			height: ${height};
			max-width: ${maxWidth};
			max-height: ${maxHeight};
			background: white;
			border-radius: 12px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
			overflow: hidden;
		`;

		// Create header with close button
		const header = document.createElement("div");
		header.style.cssText = `
			padding: 20px 24px;
			border-bottom: 1px solid #e5e7eb;
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #f8fafc;
			flex-shrink: 0;
		`;

		const title = document.createElement("h3");
		title.textContent = fileName;
		title.style.cssText = `
			margin: 0;
			font-size: 18px;
			font-weight: 600;
			color: #1f2937;
			max-width: calc(100% - 50px);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		`;

		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = "✕";
		closeBtn.style.cssText = `
			background: #f3f4f6;
			border: none;
			font-size: 20px;
			cursor: pointer;
			color: #6b7280;
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 8px;
			transition: all 0.2s ease;
		`;
		closeBtn.onmouseover = () => {
			closeBtn.style.background = "#ef4444";
			closeBtn.style.color = "white";
		};
		closeBtn.onmouseout = () => {
			closeBtn.style.background = "#f3f4f6";
			closeBtn.style.color = "#6b7280";
		};

		// Create iframe container
		const iframeContainer = document.createElement("div");
		iframeContainer.style.cssText = `
			flex: 1;
			position: relative;
			background: #f8fafc;
			min-height: 0;
			overflow: hidden;
		`;

		// Create loading indicator
		const loadingContainer = document.createElement("div");
		loadingContainer.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: #f8fafc;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		`;

		const spinner = document.createElement("div");
		spinner.innerHTML = `
			<svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		`;

		const loadingText = document.createElement("p");
		loadingText.textContent = "Loading file...";
		loadingText.style.cssText = `
			margin-top: 12px;
			font-size: 14px;
			color: #6b7280;
			font-weight: 500;
		`;

		const progressBar = document.createElement("div");
		progressBar.style.cssText = `
			width: 200px;
			height: 4px;
			background: #e5e7eb;
			border-radius: 2px;
			margin-top: 16px;
			overflow: hidden;
		`;

		const progressFill = document.createElement("div");
		progressFill.style.cssText = `
			width: 0%;
			height: 100%;
			background: linear-gradient(90deg, #3b82f6, #1d4ed8);
			border-radius: 2px;
			transition: width 0.3s ease;
		`;

		// Animate progress bar
		let progress = 0;
		const progressInterval = setInterval(() => {
			progress += Math.random() * 30;
			if (progress > 90) progress = 90; // Stop at 90% until actual load
			progressFill.style.width = progress + "%";
		}, 200);

		progressBar.appendChild(progressFill);
		loadingContainer.appendChild(spinner);
		loadingContainer.appendChild(loadingText);
		loadingContainer.appendChild(progressBar);

		// Create secure iframe for file viewing
		const iframe = document.createElement("iframe");
		// Use the appropriate viewer URL for the file type
		const viewerUrl = SecureViewer.getViewerUrl(url, fileName);
		iframe.src = viewerUrl;
		iframe.style.cssText = `
			width: 100%;
			height: 100%;
			border: none;
			display: block;
			opacity: 0;
			transition: opacity 0.3s ease;
		`;

		// Remove sandbox restrictions that are blocking PowerPoint files
		// Focus on content display rather than download prevention
		iframe.setAttribute("referrerpolicy", "no-referrer");

		// Disable right-click context menu on iframe
		iframe.addEventListener("contextmenu", (e) => e.preventDefault());

		// Handle iframe load
		let loadTimeout;
		iframe.onload = () => {
			// Clear any existing timeout
			if (loadTimeout) {
				clearTimeout(loadTimeout);
			}

			// Complete progress bar
			clearInterval(progressInterval);
			progressFill.style.width = "100%";

			// Hide loading and show iframe after a short delay
			setTimeout(() => {
				loadingContainer.style.opacity = "0";
				loadingContainer.style.transition = "opacity 0.3s ease";
				iframe.style.opacity = "1";

				setTimeout(() => {
					loadingContainer.style.display = "none";
				}, 300);
			}, 500);

			// Additional security: try to hide PDF controls via postMessage
			try {
				iframe.contentWindow.postMessage({ type: "HIDE_CONTROLS" }, "*");
			} catch {
				// Ignore cross-origin errors
			}
		};

		// Set a timeout for loading (especially important for PowerPoint files)
		loadTimeout = setTimeout(() => {
			const extension = fileName.split(".").pop()?.toLowerCase();

			// For Office documents, provide additional guidance
			if (["ppt", "pptx", "doc", "docx"].includes(extension)) {
				clearInterval(progressInterval);

				// Create a help message for Office files
				const helpContainer = document.createElement("div");
				helpContainer.style.cssText = `
					padding: 20px;
					text-align: center;
					color: #6b7280;
				`;

				const extension_name = ["ppt", "pptx"].includes(extension)
					? "PowerPoint"
					: "Word";
				helpContainer.innerHTML = `
					<div style="font-size: 48px; margin-bottom: 16px;">📄</div>
					<h3 style="margin: 0 0 12px 0; color: #1f2937;">Unable to preview ${extension_name} file</h3>
					<p style="margin: 0 0 16px 0; font-size: 14px;">
						Your browser cannot display this ${extension_name} file directly. 
						You can download it to view with appropriate software.
					</p>
					<p style="margin: 0; font-size: 12px; font-style: italic;">
						File: ${fileName}
					</p>
				`;

				// Replace loading container with help message
				loadingContainer.innerHTML = "";
				loadingContainer.appendChild(helpContainer);
				loadingContainer.style.opacity = "1";
			}
		}, 10000); // 10 second timeout

		// Handle iframe error
		iframe.onerror = () => {
			clearInterval(progressInterval);
			const extension = fileName.split(".").pop()?.toLowerCase();

			let errorMessage = "Failed to load file";
			if (["ppt", "pptx"].includes(extension)) {
				errorMessage =
					"Unable to display PowerPoint file. Your browser may not support inline viewing of this file type.";
			} else if (["doc", "docx"].includes(extension)) {
				errorMessage =
					"Unable to display Word document. Your browser may not support inline viewing of this file type.";
			}

			loadingText.textContent = errorMessage;
			loadingText.style.color = "#ef4444";
			loadingText.style.fontSize = "12px";
			loadingText.style.maxWidth = "300px";
			loadingText.style.textAlign = "center";
			spinner.style.display = "none";
			progressBar.style.display = "none";
		};

		// Close modal function
		const closeModal = () => {
			// Clear any existing timeout
			if (loadTimeout) {
				clearTimeout(loadTimeout);
			}
			clearInterval(progressInterval);
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
		iframeContainer.appendChild(iframe);
		iframeContainer.appendChild(loadingContainer);
		modalContent.appendChild(header);
		modalContent.appendChild(iframeContainer);
		modal.appendChild(modalContent);
		document.body.appendChild(modal);

		// Add keyboard navigation
		document.addEventListener("keydown", function escHandler(e) {
			if (e.key === "Escape") {
				closeModal();
				document.removeEventListener("keydown", escHandler);
			}
		});
	},

	/**
	 * Opens a secure viewer modal for books and documents with metadata
	 * @param {Object} item - The book/document object with title, author, etc.
	 * @param {Object} options - Additional options for customization
	 */
	openBookViewer: (item, options = {}) => {
		const { width = "90%", height = "90%", maxWidth = "800px" } = options;

		// Create modal overlay
		const modal = document.createElement("div");
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.9);
			z-index: 99999;
			display: flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: blur(4px);
		`;

		// Create modal content
		const modalContent = document.createElement("div");
		modalContent.style.cssText = `
			width: ${width};
			height: ${height};
			max-width: ${maxWidth};
			background: white;
			border-radius: 12px;
			display: flex;
			flex-direction: column;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
			overflow: hidden;
		`;

		// Create header with close button
		const header = document.createElement("div");
		header.style.cssText = `
			padding: 20px 24px;
			border-bottom: 1px solid #e5e7eb;
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #f8fafc;
			flex-shrink: 0;
		`;

		const title = document.createElement("h3");
		title.textContent = item.title;
		title.style.cssText = `
			margin: 0;
			font-size: 18px;
			font-weight: 600;
			color: #1f2937;
			max-width: calc(100% - 50px);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		`;

		const closeBtn = document.createElement("button");
		closeBtn.innerHTML = "✕";
		closeBtn.style.cssText = `
			background: #f3f4f6;
			border: none;
			font-size: 20px;
			cursor: pointer;
			color: #6b7280;
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 8px;
			transition: all 0.2s ease;
		`;
		closeBtn.onmouseover = () => {
			closeBtn.style.background = "#ef4444";
			closeBtn.style.color = "white";
		};
		closeBtn.onmouseout = () => {
			closeBtn.style.background = "#f3f4f6";
			closeBtn.style.color = "#6b7280";
		};

		// Create content area
		const content = document.createElement("div");
		content.style.cssText = `
			flex: 1;
			padding: 24px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			background: #f8fafc;
			overflow-y: auto;
		`;

		const itemIcon = document.createElement("div");
		itemIcon.innerHTML = item.icon || "📚";
		itemIcon.style.cssText = `
			font-size: 64px;
			margin-bottom: 16px;
		`;

		const itemInfo = document.createElement("div");
		itemInfo.style.cssText = `
			text-align: center;
			max-width: 500px;
		`;

		const infoHTML = `
			<h4 style="font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">${
				item.title
			}</h4>
			<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Author:</strong> ${
				item.author
			}</p>
			${
				item.isbn
					? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>ISBN:</strong> ${item.isbn}</p>`
					: ""
			}
			${
				item.edition
					? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Edition:</strong> ${item.edition}</p>`
					: ""
			}
			${
				item.year
					? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Year:</strong> ${item.year}</p>`
					: ""
			}
			${
				item.category
					? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 8px;"><strong>Category:</strong> ${item.category}</p>`
					: ""
			}
			${
				item.description
					? `<p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">${item.description}</p>`
					: ""
			}
			<p style="font-size: 14px; color: #9ca3af; font-style: italic;">Content would be displayed here in a secure reader</p>
		`;
		itemInfo.innerHTML = infoHTML;

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
		content.appendChild(itemIcon);
		content.appendChild(itemInfo);
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
	},
};

export default SecureViewer;
