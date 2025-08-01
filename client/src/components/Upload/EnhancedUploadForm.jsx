import React, { useState } from "react";
import {
	uploadFilesToServer,
	validateFile,
} from "../../services/apiService.js";
import styles from "../../styles/EnhancedUpload.module.css";

const EnhancedUploadForm = ({ onUpload, uploadConfig }) => {
	const [files, setFiles] = useState([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [tags, setTags] = useState("");
	const [dragActive, setDragActive] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(null);
	const [validationErrors, setValidationErrors] = useState([]);

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			handleFiles(Array.from(e.dataTransfer.files));
		}
	};

	const handleFileChange = (e) => {
		if (e.target.files) {
			handleFiles(Array.from(e.target.files));
		}
	};

	const handleFiles = (newFiles) => {
		const errors = [];
		const validFiles = [];

		newFiles.forEach((file) => {
			const validation = validateFile(file);
			if (validation.valid) {
				validFiles.push(file);
			} else {
				errors.push(`${file.name}: ${validation.error}`);
			}
		});

		setValidationErrors(errors);
		setFiles((prevFiles) => [...prevFiles, ...validFiles]);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!files.length || !title.trim()) {
			alert("Please select files and enter a title");
			return;
		}

		if (validationErrors.length > 0) {
			alert("Please fix file validation errors before uploading");
			return;
		}

		setUploading(true);
		setUploadProgress({
			currentFile: 0,
			totalFiles: files.length,
			status: "starting",
		});

		try {
			// Upload files to server
			const uploadResult = await uploadFilesToServer(
				files,
				uploadConfig,
				setUploadProgress
			);

			if (!uploadResult.success) {
				throw new Error(uploadResult.error || "Upload failed");
			}

			// Check if there were any failed uploads
			const failedUploads = uploadResult.results.filter(
				(result) => !result.success
			);
			const successfulUploads = uploadResult.results.filter(
				(result) => result.success
			);

			// Show detailed results for multiple files
			if (files.length > 1) {
				console.log(
					`Upload Results: ${successfulUploads.length} successful, ${failedUploads.length} failed`
				);

				if (failedUploads.length > 0) {
					const failedFileNames = failedUploads
						.map((f) => f.fileName || "Unknown file")
						.slice(0, 3)
						.join(", ");
					const moreFailures =
						failedUploads.length > 3
							? ` and ${failedUploads.length - 3} more`
							: "";

					console.warn(`Failed uploads: ${failedFileNames}${moreFailures}`);

					if (successfulUploads.length === 0) {
						throw new Error(
							`All ${files.length} files failed to upload. First error: ${failedUploads[0].error}`
						);
					} else {
						// Partial success - show info but continue
						const message =
							files.length > 10
								? `Batch upload completed: ${successfulUploads.length}/${files.length} files uploaded successfully. ${failedUploads.length} files failed (check console for details).`
								: `${successfulUploads.length} files uploaded successfully, but ${failedUploads.length} failed. Check console for details.`;

						alert(message);
					}
				} else {
					// All successful
					if (files.length > 10) {
						alert(
							`🎉 Batch upload successful! All ${files.length} files uploaded successfully.`
						);
					}
				}
			}

			// Prepare upload data with server results
			const uploadData = {
				title: title.trim(),
				description: description.trim(),
				tags: tags
					.trim()
					.split(",")
					.map((tag) => tag.trim())
					.filter((tag) => tag),
				files: successfulUploads.map((result) => result.data),
				failedUploads: failedUploads,
				uploadConfig,
				uploadedAt: new Date().toISOString(),
				totalFiles: uploadResult.totalFiles,
				successCount: uploadResult.successCount,
				batchUpload: files.length > 10, // Flag for batch uploads
			};

			// Call parent upload handler
			await onUpload(uploadData);

			// Reset form on success
			setFiles([]);
			setTitle("");
			setDescription("");
			setTags("");
			setValidationErrors([]);
			setUploadProgress(null);
		} catch (error) {
			console.error("Upload error:", error);
			const errorMessage =
				files.length > 10
					? `Batch upload failed: ${error.message}. Try uploading fewer files at once.`
					: `Upload failed: ${error.message}`;
			alert(errorMessage);
		} finally {
			setUploading(false);
		}
	};

	const removeFile = (index) => {
		setFiles(files.filter((_, i) => i !== index));
		// Clear validation errors if all files are removed
		if (files.length === 1) {
			setValidationErrors([]);
		}
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const getFileIcon = (file) => {
		const type = file.type;
		if (type.includes("pdf")) return "📄";
		if (type.includes("image")) return "🖼️";
		if (type.includes("word") || type.includes("document")) return "📝";
		if (type.includes("powerpoint") || type.includes("presentation"))
			return "📊";
		if (type.includes("text")) return "📃";
		return "📁";
	};

	return (
		<div className="bg-gradient-to-br from-white to-gray-50 p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-sm max-w-6xl mx-auto">
			<div className="text-center mb-6">
				<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
					<svg
						className="w-8 h-8 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
				</div>
				<h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
					Upload Your Files
				</h3>
				<p className="text-gray-600">
					Share your academic resources with the community
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Upload Configuration Summary */}
				<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50 shadow-sm">
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
							<svg
								className="w-4 h-4 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h4 className="font-semibold text-blue-900 text-lg">
							Upload Configuration
						</h4>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="space-y-3">
							<div className="flex items-center">
								<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
								<span className="text-sm text-gray-600">College:</span>
								<span className="ml-2 font-medium text-blue-900">
									{uploadConfig.college}
								</span>
							</div>
							<div className="flex items-center">
								<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
								<span className="text-sm text-gray-600">Course:</span>
								<span className="ml-2 font-medium text-blue-900">
									{uploadConfig.course}
								</span>
							</div>
						</div>
						<div className="space-y-3">
							{uploadConfig.subcourse && (
								<div className="flex items-center">
									<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
									<span className="text-sm text-gray-600">Specialization:</span>
									<span className="ml-2 font-medium text-blue-900">
										{uploadConfig.subcourse}
									</span>
								</div>
							)}
							<div className="flex items-center">
								<span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
								<span className="text-sm text-gray-600">Type:</span>
								<span className="ml-2 font-medium text-purple-900">
									{uploadConfig.uploadType}
								</span>
							</div>
						</div>
						<div className="space-y-3">
							{uploadConfig.semester && (
								<div className="flex items-center">
									<span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
									<span className="text-sm text-gray-600">Semester:</span>
									<span className="ml-2 font-medium text-purple-900">
										{uploadConfig.semester}
									</span>
								</div>
							)}
							{uploadConfig.subject && (
								<div className="flex items-center">
									<span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
									<span className="text-sm text-gray-600">Subject:</span>
									<span className="ml-2 font-medium text-purple-900">
										{uploadConfig.subject}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* File Upload Area */}
				<div
					className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 group ${
						dragActive
							? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 scale-102"
							: "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
					} ${uploading ? "pointer-events-none opacity-50" : ""}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<div className="text-gray-600">
						<div
							className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 ${
								styles.floatAnimation || "float-animation"
							}`}
						>
							<svg
								className="w-10 h-10 text-blue-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
						</div>
						<h4 className="text-xl font-semibold text-gray-800 mb-3">
							Drop your files here
						</h4>
						<p className="text-lg mb-4">
							or{" "}
							<label className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold underline decoration-2 underline-offset-2 hover:decoration-blue-700 transition-colors">
								browse to upload
								<input
									type="file"
									multiple
									onChange={handleFileChange}
									className="hidden"
									accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.rar"
									disabled={uploading}
								/>
							</label>
						</p>
						<div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
							<p className="text-sm text-gray-600 mb-2 font-medium">
								Supported formats:
							</p>
							<div className="flex flex-wrap gap-2 justify-center">
								{[
									"PDF",
									"DOC",
									"DOCX",
									"TXT",
									"PPT",
									"PPTX",
									"JPG",
									"PNG",
									"ZIP",
									"RAR",
								].map((format) => (
									<span
										key={format}
										className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
									>
										{format}
									</span>
								))}
							</div>
							<p className="text-xs text-gray-500 mt-3">
								Maximum file size: 50MB each
							</p>
						</div>
					</div>
				</div>

				{/* Validation Errors */}
				{validationErrors.length > 0 && (
					<div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-6 rounded-xl shadow-sm">
						<div className="flex items-center mb-3">
							<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
								<svg
									className="w-5 h-5 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h4 className="font-semibold text-red-800 text-lg">
								File Validation Issues
							</h4>
						</div>
						<div className="bg-white/70 rounded-lg p-4">
							<ul className="space-y-2">
								{validationErrors.map((error, index) => (
									<li key={index} className="flex items-start">
										<span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										<span className="text-sm text-red-700">{error}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Upload Progress */}
				{uploadProgress && (
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center">
								<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
									<svg
										className="w-5 h-5 text-white animate-spin"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</div>
								<h4 className="font-semibold text-blue-800 text-lg">
									Upload in Progress
								</h4>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-blue-600">
									{Math.round(
										(uploadProgress.currentFile / uploadProgress.totalFiles) *
											100
									)}
									%
								</div>
								<div className="text-xs text-blue-600">Complete</div>
							</div>
						</div>

						<div className="bg-white/70 rounded-lg p-4 mb-4">
							<div className="text-sm text-blue-700 space-y-2">
								{uploadProgress.totalFiles > 10 ? (
									<div className="flex items-center">
										<span className="text-xl mr-2">📦</span>
										<span>
											Large upload detected - processing in batches of 5 files
										</span>
									</div>
								) : uploadProgress.totalFiles > 1 ? (
									<div className="flex items-center">
										<span className="text-xl mr-2">⚡</span>
										<span>
											Uploading {uploadProgress.totalFiles} files in parallel...
										</span>
									</div>
								) : (
									<div className="flex items-center">
										<span className="text-xl mr-2">📄</span>
										<span>
											File {uploadProgress.currentFile} of{" "}
											{uploadProgress.totalFiles}
										</span>
									</div>
								)}

								{uploadProgress.fileName && (
									<div className="flex items-center">
										<span className="text-xl mr-2">📋</span>
										<span className="font-medium truncate">
											Current: {uploadProgress.fileName}
										</span>
									</div>
								)}

								<div className="flex items-center">
									<span className="text-xl mr-2">🔄</span>
									<span className="capitalize font-medium">
										Status: {uploadProgress.status}
									</span>
								</div>
							</div>
						</div>

						{/* Progress Bar */}
						<div className="relative">
							<div className="bg-blue-200 rounded-full h-3 overflow-hidden">
								<div
									className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
									style={{
										width:
											uploadProgress.status === "starting"
												? "5%"
												: uploadProgress.status === "uploading"
												? `${Math.min(
														(uploadProgress.currentFile /
															uploadProgress.totalFiles) *
															90 +
															5,
														95
												  )}%`
												: uploadProgress.status === "completed"
												? "100%"
												: uploadProgress.status === "error"
												? "0%"
												: `${Math.min(
														(uploadProgress.currentFile /
															uploadProgress.totalFiles) *
															100,
														95
												  )}%`,
									}}
								>
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
								</div>
							</div>
							<div className="flex justify-between mt-2 text-xs text-blue-600">
								<span>
									Progress: {uploadProgress.currentFile}/
									{uploadProgress.totalFiles} files
								</span>
								<span>{uploadProgress.status}</span>
							</div>
						</div>

						{uploadProgress.status === "completed" &&
							uploadProgress.results && (
								<div className="mt-4 p-4 bg-white/70 rounded-lg">
									<div className="flex justify-between items-center">
										<div className="flex items-center">
											<span className="text-2xl mr-2">✅</span>
											<span className="text-green-700 font-medium">
												{uploadProgress.results.filter((r) => r.success).length}{" "}
												successful
											</span>
										</div>
										{uploadProgress.results.filter((r) => !r.success).length >
											0 && (
											<div className="flex items-center">
												<span className="text-2xl mr-2">❌</span>
												<span className="text-red-700 font-medium">
													{
														uploadProgress.results.filter((r) => !r.success)
															.length
													}{" "}
													failed
												</span>
											</div>
										)}
									</div>
								</div>
							)}
					</div>
				)}

				{/* Selected Files */}
				{files.length > 0 && (
					<div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center">
								<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
									<svg
										className="w-4 h-4 text-white"
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
								</div>
								<h4 className="font-semibold text-gray-900 text-lg">
									Selected Files ({files.length})
								</h4>
							</div>
							{files.length > 10 && (
								<div className="flex items-center bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
									<span className="text-lg mr-1">📦</span>
									<span className="text-sm font-medium">
										Large upload - will process in batches
									</span>
								</div>
							)}
						</div>
						<div
							className={`space-y-3 max-h-80 overflow-y-auto ${
								styles.customScrollbar || "custom-scrollbar"
							}`}
						>
							{files.map((file, index) => (
								<div
									key={index}
									className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
								>
									<div className="flex items-center space-x-4 flex-1 min-w-0">
										<div className="text-3xl flex-shrink-0">
											{getFileIcon(file)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
												{file.name}
											</p>
											<div className="flex items-center space-x-4 mt-1">
												<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
													{formatFileSize(file.size)}
												</span>
												<span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
													{file.type || "Unknown type"}
												</span>
											</div>
										</div>
									</div>
									<button
										type="button"
										onClick={() => removeFile(index)}
										className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 group-hover:scale-110"
										disabled={uploading}
										title="Remove file"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Form Fields */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="group">
						<label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
							<svg
								className="w-4 h-4 mr-2 text-blue-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>
							Title *
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter a descriptive title for your upload..."
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm group-hover:bg-white"
							required
							disabled={uploading}
						/>
					</div>

					<div className="group">
						<label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
							<svg
								className="w-4 h-4 mr-2 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
								/>
							</svg>
							Tags (comma-separated)
						</label>
						<input
							type="text"
							value={tags}
							onChange={(e) => setTags(e.target.value)}
							placeholder="exam, notes, important, chapter1, midterm, final, etc."
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/50 backdrop-blur-sm group-hover:bg-white"
							disabled={uploading}
						/>
						<p className="text-xs text-gray-500 mt-2 flex items-center">
							<svg
								className="w-3 h-3 mr-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							Add relevant tags to help others discover your uploads
						</p>
					</div>

					<div className="group lg:col-span-2">
						<label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
							<svg
								className="w-4 h-4 mr-2 text-purple-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h7"
								/>
							</svg>
							Description
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Provide additional details about these files, what they contain, and how they might help other students..."
							rows={4}
							className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-vertical bg-white/50 backdrop-blur-sm group-hover:bg-white"
							disabled={uploading}
						/>
					</div>
				</div>

				{/* Submit Button */}
				<div className="pt-4">
					<button
						type="submit"
						disabled={
							uploading ||
							!files.length ||
							!title.trim() ||
							validationErrors.length > 0
						}
						className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-500/25 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
					>
						<div className="relative z-10 flex items-center justify-center">
							{uploading ? (
								<>
									<svg
										className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
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
									<span>Uploading Files...</span>
								</>
							) : (
								<>
									<svg
										className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
									<span>Upload Files to Cloud</span>
								</>
							)}
						</div>
						<div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
					</button>
				</div>
			</form>

			{/* Upload Guidelines */}
			<div className="mt-8 bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200/50">
				<div className="flex items-center mb-4">
					<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
						<svg
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h4 className="font-semibold text-gray-900 text-lg">
						Upload Guidelines
					</h4>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-3">
						<div className="flex items-start">
							<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
								<svg
									className="w-3 h-3 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<span className="text-sm text-gray-600">
								Maximum file size: 50MB per file
							</span>
						</div>
						<div className="flex items-start">
							<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
								<svg
									className="w-3 h-3 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<span className="text-sm text-gray-600">
								Supported formats: PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG,
								ZIP, RAR
							</span>
						</div>
						<div className="flex items-start">
							<div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
								<svg
									className="w-3 h-3 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<span className="text-sm text-gray-600">
								Multiple files supported - large uploads (10+ files) processed
								in batches
							</span>
						</div>
					</div>
					<div className="space-y-3">
						<div className="flex items-start">
							<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
								<svg
									className="w-3 h-3 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<span className="text-sm text-gray-600">
								Files will be reviewed before being made publicly available
							</span>
						</div>
						<div className="flex items-start">
							<div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
								<svg
									className="w-3 h-3 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<span className="text-sm text-gray-600">
								Please ensure you have permission to share the content
							</span>
						</div>
						<div className="flex items-start">
							<div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
								<svg
									className="w-3 h-3 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
									/>
								</svg>
							</div>
							<span className="text-sm text-gray-600">
								Use descriptive titles and tags for better discoverability
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EnhancedUploadForm;
