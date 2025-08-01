import React, { useState } from "react";
import { generatePresignedUrl } from "../../../services/apiService";
import SecureViewer from "../../common/SecureViewer";
import { Toast } from "../../../utils/toast";

const FileList = ({ files }) => {
	const [loadingFiles, setLoadingFiles] = useState(new Set());
	const getFileIcon = (fileName) => {
		if (fileName.toLowerCase().includes("pdf")) {
			return (
				<svg
					className="w-4 h-4 text-red-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z"
					/>
				</svg>
			);
		}
		return (
			<svg
				className="w-4 h-4 text-purple-600"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
		);
	};

	const getFileSize = () => {
		// Generate random file size for demo
		const sizes = ["1.2 MB", "856 KB", "2.1 MB", "645 KB", "1.8 MB"];
		return sizes[Math.floor(Math.random() * sizes.length)];
	};

	// Helper function to get the best display name for a file
	const getDisplayName = (file) => {
		// If we have a display name from the server (already processed), use it
		if (file.displayName && file.displayName.trim()) {
			return file.displayName;
		}

		// Check if title looks corrupted (only numbers, very short, etc.)
		const title = file.title || "";
		const titleLooksCorrupted =
			/^\d+$/.test(title.trim()) || title.trim().length < 3 || !title.trim();

		// Use original filename if title looks corrupted
		if (titleLooksCorrupted && file.originalName) {
			return file.originalName;
		}

		// Fallback to title, fileName, or a default
		return title || file.fileName || file.originalName || "Unknown File";
	};

	const handleView = async (file) => {
		const fileKey = file.key || file.fileName;

		// Add file to loading set
		setLoadingFiles((prev) => new Set(prev).add(fileKey));

		// Show loading toast
		const closeToast = Toast.showLoading(
			`Opening ${file.fileName || file.displayName}...`
		);

		try {
			// Check if this is a real S3 file or demo file
			if (file.key) {
				const url = await generatePresignedUrl(file.key, 3600); // 1 hour expiry
				if (url) {
					SecureViewer.openFileViewer(url, file.fileName || file.displayName);
					closeToast();
					Toast.showSuccess("File opened successfully!");
				} else {
					closeToast();
					Toast.showError("Failed to generate view link");
				}
			} else {
				// Demo file handling
				const demoUrl = `/demo-files/${file.fileName}`;
				SecureViewer.openFileViewer(demoUrl, file.fileName);
				closeToast();
				Toast.showSuccess("Demo file opened!");
			}
		} catch (error) {
			console.error("Error viewing file:", error);
			closeToast();
			Toast.showError("Failed to view file");
		} finally {
			// Remove file from loading set
			setLoadingFiles((prev) => {
				const newSet = new Set(prev);
				newSet.delete(fileKey);
				return newSet;
			});
		}
	};

	// DOWNLOAD FUNCTIONALITY - CURRENTLY DISABLED
	// Uncomment the function below to enable downloads
	/*
	const handleDownload = (fileName) => {
		// Demo download implementation
		alert(`Downloading ${fileName}...`);
	};
	*/

	return (
		<div className="space-y-3 max-h-64 overflow-y-auto">
			{files.length === 0 ? (
				<div className="text-center py-8 text-gray-500">
					<svg
						className="w-12 h-12 mx-auto mb-3 text-gray-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 1H7a2 2 0 00-2 2v16a2 2 0 002 2z"
						/>
					</svg>
					<p>No files available</p>
				</div>
			) : (
				files.map((file, index) => {
					// Handle both old format (string) and new format (object)
					const displayName =
						typeof file === "string" ? file : getDisplayName(file);
					const fileKey =
						typeof file === "string" ? file : file.key || file._id;

					return (
						<div
							key={index}
							className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
						>
							<div className="flex items-center space-x-3 flex-1 min-w-0">
								{getFileIcon(displayName)}
								<div className="flex-1 min-w-0">
									<p className="text-sm text-gray-800 truncate font-medium">
										{displayName}
									</p>
									<p className="text-xs text-gray-500">{getFileSize()}</p>
								</div>
							</div>
							<div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onClick={() =>
										handleView({ fileName: displayName, key: fileKey, ...file })
									}
									disabled={loadingFiles.has(fileKey)}
									className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
										loadingFiles.has(fileKey)
											? "text-gray-400 bg-gray-50 cursor-not-allowed"
											: "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
									}`}
									title={
										loadingFiles.has(fileKey)
											? "Loading file..."
											: "View file in secure viewer"
									}
								>
									{loadingFiles.has(fileKey) ? (
										<>
											<svg
												className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-400 inline"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													className="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													strokeWidth="4"
												></circle>
												<path
													className="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Loading...
										</>
									) : (
										"👁️ View Only"
									)}
								</button>
								{/* DOWNLOAD BUTTON - CURRENTLY DISABLED */}
								{/* Uncomment below to enable downloads */}
								{/*
							<button className="text-green-600 hover:text-green-800 text-xs font-medium px-3 py-1 rounded-md hover:bg-green-50 transition-colors">
								⬇️ Download
							</button>
							*/}
							</div>
						</div>
					);
				})
			)}
		</div>
	);
};

export default FileList;
