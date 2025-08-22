/**
 * Simple toast notification utility for showing loading states
 */
export const Toast = {
	/**
	 * Show a loading toast with spinner
	 * @param {string} message - The loading message to display
	 * @returns {Function} - Function to close the toast
	 */
	showLoading: (message = "Loading...") => {
		// Remove any existing loading toasts
		const existing = document.querySelector(".loading-toast");
		if (existing) {
			existing.remove();
		}

		// Create toast container
		const toast = document.createElement("div");
		toast.className = "loading-toast";
		toast.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: white;
			border: 1px solid #e5e7eb;
			border-radius: 8px;
			padding: 12px 16px;
			box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
			z-index: 50000;
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 14px;
			color: #374151;
			animation: slideIn 0.3s ease-out;
		`;

		// Add CSS animation
		if (!document.querySelector("#toast-styles")) {
			const style = document.createElement("style");
			style.id = "toast-styles";
			style.textContent = `
				@keyframes slideIn {
					from {
						transform: translateX(100%);
						opacity: 0;
					}
					to {
						transform: translateX(0);
						opacity: 1;
					}
				}
				@keyframes slideOut {
					from {
						transform: translateX(0);
						opacity: 1;
					}
					to {
						transform: translateX(100%);
						opacity: 0;
					}
				}
			`;
			document.head.appendChild(style);
		}

		// Create spinner
		const spinner = document.createElement("div");
		spinner.innerHTML = `
			<svg class="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		`;

		// Create message text
		const text = document.createElement("span");
		text.textContent = message;

		// Assemble toast
		toast.appendChild(spinner);
		toast.appendChild(text);
		document.body.appendChild(toast);

		// Return close function
		return () => {
			if (toast.parentNode) {
				toast.style.animation = "slideOut 0.3s ease-in";
				setTimeout(() => {
					if (toast.parentNode) {
						toast.parentNode.removeChild(toast);
					}
				}, 300);
			}
		};
	},

	/**
	 * Show a success toast
	 * @param {string} message - The success message
	 * @param {number} [durationMs=3000] - Duration to show the toast
	 */
	showSuccess: (message, durationMs = 3000) => {
		const closeLoading = Toast.showLoading("");
		closeLoading(); // Close any loading toasts

		const toast = document.createElement("div");
		toast.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: #10b981;
			color: white;
			border-radius: 8px;
			padding: 12px 16px;
			box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
			z-index: 50000;
			font-size: 14px;
			animation: slideIn 0.3s ease-out;
		`;
		toast.textContent = message;
		document.body.appendChild(toast);

		// Auto remove after provided duration
		setTimeout(() => {
			if (toast.parentNode) {
				toast.style.animation = "slideOut 0.3s ease-in";
				setTimeout(() => {
					if (toast.parentNode) {
						toast.parentNode.removeChild(toast);
					}
				}, 300);
			}
		}, durationMs);
	},

	/**
	 * Show an error toast
	 * @param {string} message - The error message
	 */
	showError: (message) => {
		const closeLoading = Toast.showLoading("");
		closeLoading(); // Close any loading toasts

		const toast = document.createElement("div");
		toast.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background: #ef4444;
			color: white;
			border-radius: 8px;
			padding: 12px 16px;
			box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
			z-index: 50000;
			font-size: 14px;
			animation: slideIn 0.3s ease-out;
		`;
		toast.textContent = message;
		document.body.appendChild(toast);

		// Auto remove after 5 seconds
		setTimeout(() => {
			if (toast.parentNode) {
				toast.style.animation = "slideOut 0.3s ease-in";
				setTimeout(() => {
					if (toast.parentNode) {
						toast.parentNode.removeChild(toast);
					}
				}, 300);
			}
		}, 5000);
	},
};
