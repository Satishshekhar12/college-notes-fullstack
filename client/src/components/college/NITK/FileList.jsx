import React, { useState } from "react";
import { generatePresignedUrl } from "../../../services/apiService";
import SecureViewer from "../../common/SecureViewer";
import { Toast } from "../../../utils/toast";

const FileList = ({ files, renderMeta }) => {
	const [loadingFiles, setLoadingFiles] = useState(new Set());
	const getFileIcon = () => {
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
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
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

		console.log("🔍 FileList handleView called with file:", {
			title: file.title,
			fileName: file.fileName,
			displayName: file.displayName,
			key: file.key,
			mimeType: file.mimeType,
			originalName: file.originalName,
			s3Key: fileKey,
		});

		// Add file to loading set
		setLoadingFiles((prev) => new Set(prev).add(fileKey));

		// Show loading toast
		const closeToast = Toast.showLoading(
			`Opening ${file.fileName || file.displayName}...`
		);

		try {
			console.log("📡 Requesting presigned URL for key:", fileKey);
			const url = await generatePresignedUrl(file.key, 3600); // 1 hour expiry

			console.log(
				"🔗 Received presigned URL:",
				url ? "✅ Success" : "❌ Failed"
			);

			if (url) {
				// Use SecureViewer for all file types
				const fileName = file.fileName || file.displayName;
				SecureViewer.openFileViewer(url, fileName);
				closeToast();
				Toast.showSuccess("File opened for viewing!");
			} else {
				closeToast();
				Toast.showError("Failed to generate view link");
			}
		} catch (error) {
			console.error("❌ Error viewing file:", error);
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
	const handleDownload = async (file) => {
		try {
			const url = await generatePresignedUrl(file.key, 3600);
			if (url) {
				const link = document.createElement("a");
				link.href = url;
				link.download = file.fileName;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} else {
				alert("Failed to generate download link");
			}
		} catch (error) {
			console.error("Error downloading file:", error);
			alert("Failed to download file");
		}
	};
	*/

	if (!files || files.length === 0) {
		return (
			<div className="text-center py-4 text-gray-500">
				<p className="text-sm">No files available</p>
			</div>
		);
	}

	return (
		<div className="space-y-2 max-h-64 overflow-y-auto">
			{files.map((file, index) => (
				<div
					key={file.key || index}
					className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors border border-gray-200"
				>
					<div className="flex items-center space-x-3 flex-1 min-w-0">
						{getFileIcon()}
						<div className="flex-1 min-w-0">
							<p className="text-sm text-gray-800 truncate font-medium">
								{getDisplayName(file)}
							</p>
							{renderMeta && (
								<div className="text-[11px] text-gray-500 truncate mt-0.5">
									{renderMeta(file)}
								</div>
							)}
							<div className="flex items-center space-x-2 text-xs text-gray-500">
								<span>{formatFileSize(file.size)}</span>
								<span>•</span>
								<span>{formatDate(file.lastModified)}</span>
							</div>
						</div>
					</div>
					<div className="flex space-x-1 ml-2">
						<button
							onClick={() => handleView(file)}
							disabled={loadingFiles.has(file.key || file.fileName)}
							className={`text-xs font-medium px-3 py-1 rounded transition-colors border ${
								loadingFiles.has(file.key || file.fileName)
									? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
									: "text-blue-600 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
							}`}
							title={
								loadingFiles.has(file.key || file.fileName)
									? "Loading file..."
									: "View file in secure viewer"
							}
						>
							{loadingFiles.has(file.key || file.fileName) ? (
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
								"View"
							)}
						</button>
						{/* DOWNLOAD BUTTON - CURRENTLY DISABLED */}
						{/* Uncomment below to enable downloads */}
						{/*
						<button
							onClick={() => handleDownload(file)}
							className="text-green-600 hover:text-green-800 text-xs font-medium px-3 py-1 rounded hover:bg-green-50 transition-colors border border-green-200"
							title="Download file"
						>
							⬇️ Download
						</button>
						*/}
					</div>
				</div>
			))}
		</div>
	);
};

export default FileList;
