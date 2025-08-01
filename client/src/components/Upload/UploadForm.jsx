import React, { useState } from "react";

const UploadForm = ({ onUpload, uploadConfig }) => {
	const [files, setFiles] = useState([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [subject, setSubject] = useState("");
	const [dragActive, setDragActive] = useState(false);

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
			setFiles(Array.from(e.dataTransfer.files));
		}
	};

	const handleFileChange = (e) => {
		if (e.target.files) {
			setFiles(Array.from(e.target.files));
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!files.length || !title.trim()) {
			alert("Please select files and enter a title");
			return;
		}

		const uploadData = {
			files,
			title: title.trim(),
			description: description.trim(),
			subject: subject.trim(),
			...uploadConfig,
		};

		onUpload(uploadData);

		// Reset form
		setFiles([]);
		setTitle("");
		setDescription("");
		setSubject("");
	};

	const removeFile = (index) => {
		setFiles(files.filter((_, i) => i !== index));
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	return (
		<div className="bg-white p-6 rounded-lg border border-gray-200">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* File Upload Area */}
				<div
					className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
						dragActive
							? "border-blue-500 bg-blue-50"
							: "border-gray-300 hover:border-gray-400"
					}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<div className="text-gray-600">
						<div className="text-3xl mb-3">📁</div>
						<p className="text-lg mb-2">
							Drag and drop files here, or{" "}
							<label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
								browse
								<input
									type="file"
									multiple
									onChange={handleFileChange}
									className="hidden"
									accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
								/>
							</label>
						</p>
						<p className="text-sm text-gray-500">
							Supports: PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG
						</p>
					</div>
				</div>

				{/* Selected Files */}
				{files.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-medium text-gray-900">Selected Files:</h4>
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{files.map((file, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
								>
									<div className="flex items-center space-x-3">
										<div className="text-blue-600">📄</div>
										<div>
											<p className="text-sm font-medium text-gray-900">
												{file.name}
											</p>
											<p className="text-xs text-gray-500">
												{formatFileSize(file.size)}
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => removeFile(index)}
										className="text-red-600 hover:text-red-700 p-1"
									>
										✕
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Form Fields */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Title *
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter title..."
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Subject
						</label>
						<input
							type="text"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Enter subject..."
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						/>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Description
					</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Enter description..."
						rows={4}
						className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
					/>
				</div>

				{/* Submit Button */}
				<button
					type="submit"
					className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
				>
					Upload Files
				</button>
			</form>
		</div>
	);
};

export default UploadForm;
