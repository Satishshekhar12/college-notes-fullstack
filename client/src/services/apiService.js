// API service for server communication
import { API_BASE_URL } from "../config/api";

/**
 * Upload files to server using the new note system
 * @param {FileList|Array} files - Files to upload
 * @param {Object} uploadConfig - Upload configuration
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} - Upload result
 */
export const uploadFilesToServer = async (files, uploadConfig, onProgress) => {
	try {
		const filesArray = Array.from(files);
		const totalFiles = filesArray.length;
		const allResults = [];

		// Get authentication token if available (guest uploads allowed when setting is off)
		const token = localStorage.getItem("userToken");

		// Initial progress update
		if (onProgress) {
			onProgress({
				currentFile: 0,
				totalFiles: totalFiles,
				status: "starting",
				fileName: `Preparing to upload ${totalFiles} files...`,
			});
		}

		// Upload files one by one (the new note system expects single file uploads)
		for (let i = 0; i < filesArray.length; i++) {
			const file = filesArray[i];

			// Update progress for current file
			if (onProgress) {
				onProgress({
					currentFile: i,
					totalFiles: totalFiles,
					status: "uploading",
					fileName: `Uploading ${file.name}...`,
				});
			}

			try {
				// Create FormData for single file upload to note system
				const formData = new FormData();
				formData.append("file", file);

				// Add note metadata
				formData.append("title", file.name.split(".")[0]); // Use filename as title
				formData.append("description", String(uploadConfig.description || ""));
				formData.append("college", String(uploadConfig.college || ""));
				formData.append("course", String(uploadConfig.course || ""));
				formData.append("subcourse", String(uploadConfig.subcourse || ""));
				formData.append("semester", String(uploadConfig.semester || "")); // Ensure semester is a string
				formData.append("subject", String(uploadConfig.subject || ""));
				formData.append("uploadType", String(uploadConfig.uploadType || ""));
				formData.append(
					"tags",
					uploadConfig.tags ? uploadConfig.tags.join(",") : ""
				);
				// Optional metadata
				if (uploadConfig.professor) {
					formData.append("professor", String(uploadConfig.professor));
				}
				if (uploadConfig.year) {
					formData.append("year", String(uploadConfig.year));
				}

				const response = await fetch(`${API_BASE_URL}/api/notes/upload`, {
					method: "POST",
					// Only send Authorization header when a token exists
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || `HTTP ${response.status}`);
				}

				const result = await response.json();

				if (result.success) {
					allResults.push({
						success: true,
						fileName: file.name,
						data: result.data,
					});
				} else {
					allResults.push({
						success: false,
						fileName: file.name,
						error: result.message || "Upload failed",
					});
				}
			} catch (fileError) {
				console.error(`Failed to upload ${file.name}:`, fileError);
				allResults.push({
					success: false,
					fileName: file.name,
					error: fileError.message,
				});
			}

			// Small delay between uploads to prevent server overload
			if (i < filesArray.length - 1) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		}

		const successCount = allResults.filter((r) => r.success).length;
		const failureCount = allResults.filter((r) => !r.success).length;

		// Final progress update
		if (onProgress) {
			onProgress({
				currentFile: totalFiles,
				totalFiles: totalFiles,
				status: "completed",
				fileName: `Upload complete: ${successCount} successful, ${failureCount} failed`,
				results: allResults,
			});
		}

		return {
			success: successCount > 0, // Consider successful if at least one file uploaded
			results: allResults,
			totalFiles: totalFiles,
			successCount: successCount,
			failureCount: failureCount,
		};
	} catch (error) {
		console.error("Upload error:", error);
		if (onProgress) {
			onProgress({
				currentFile: 0,
				totalFiles: files.length,
				status: "error",
				fileName: "Upload failed completely",
			});
		}
		return {
			success: false,
			error: error.message || "Upload failed",
			results: [],
			totalFiles: files.length,
			successCount: 0,
			failureCount: files.length,
		};
	}
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateFile = (file, options = {}) => {
	const {
		maxSize = 50 * 1024 * 1024, // 50MB default
		allowedTypes = [
			"application/pdf",
			"image/jpeg",
			"image/png",
			"text/plain",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"application/vnd.ms-powerpoint",
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		],
		maxNameLength = 100,
	} = options;

	// Check file size
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
		};
	}

	// Check file type
	if (!allowedTypes.includes(file.type)) {
		return {
			valid: false,
			error: `File type ${file.type} is not allowed`,
		};
	}

	// Check file name length
	if (file.name.length > maxNameLength) {
		return {
			valid: false,
			error: `File name exceeds ${maxNameLength} character limit`,
		};
	}

	return { valid: true };
};

/**
 * Generate presigned URL for file access
 * @param {string} s3Key - S3 key of the file
 * @param {number} expiresIn - URL expiration time in seconds
 * @returns {Promise<string>} - Presigned URL
 */
export const generatePresignedUrl = async (s3Key, expiresIn = 3600) => {
	try {
		const response = await fetch(`${API_BASE_URL}/api/presigned-url`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ s3Key, expiresIn }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.success ? result.url : null;
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		return null;
	}
};

/**
 * Delete file from server/S3
 * @param {string} s3Key - S3 key of the file to delete
 * @returns {Promise} - Deletion result
 */
export const deleteFileFromServer = async (s3Key) => {
	try {
		const encodedKey = encodeURIComponent(s3Key);
		const response = await fetch(`${API_BASE_URL}/api/files/${encodedKey}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Delete error:", error);
		return {
			success: false,
			error: error.message || "Delete failed",
		};
	}
};

/**
 * Get file metadata from server/S3
 * @param {string} s3Key - S3 key of the file
 * @returns {Promise} - File metadata
 */
export const getFileMetadata = async (s3Key) => {
	try {
		const encodedKey = encodeURIComponent(s3Key);
		const response = await fetch(
			`${API_BASE_URL}/api/files/${encodedKey}/metadata`
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Metadata error:", error);
		return {
			success: false,
			error: error.message || "Failed to get metadata",
		};
	}
};

/**
 * List files from S3 bucket
 * @param {string} prefix - S3 path prefix to filter files
 * @returns {Promise} - List of files
 */
export const listFilesFromServer = async (prefix = "") => {
	try {
		const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
		const response = await fetch(`${API_BASE_URL}/api/files${params}`);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Error listing files:", error);
		return {
			success: false,
			error: error.message || "Failed to list files",
		};
	}
};

/**
 * List files by category (college, course, semester, subject)
 * @param {Object} params - Filter parameters
 * @returns {Promise} - Organized file list
 */
export const listFilesByCategory = async (params) => {
	try {
		const queryParams = new URLSearchParams();

		if (params.college) queryParams.append("college", params.college);
		if (params.course) queryParams.append("course", params.course);
		if (params.semester) queryParams.append("semester", params.semester);
		if (params.subject) queryParams.append("subject", params.subject);
		if (params.type) queryParams.append("type", params.type); // Add type parameter for filtering

		const apiUrl = `${API_BASE_URL}/api/files/category?${queryParams}`;

		console.log("🌐 API Request:", { url: apiUrl, params });

		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Error listing files by category:", error);
		return {
			success: false,
			error: error.message || "Failed to list files by category",
		};
	}
};

// ===== Google Drive: Personal Files (for Google-linked users) =====

export const listPersonalDriveFiles = async (parentId) => {
	try {
		const token = localStorage.getItem("userToken");
		const url = new URL(`${API_BASE_URL}/api/drive/files`);
		if (parentId) url.searchParams.set("parentId", parentId);
		const res = await fetch(url.toString(), {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to list Drive files");
		return data;
	} catch (e) {
		console.error("Drive list error:", e);
		return { success: false, message: e.message };
	}
};

// Personal Drive: Folders
export const createPersonalDriveFolder = async (name) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/folders`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ name }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to create folder");
		return data?.data?.folder;
	} catch (e) {
		console.error("Drive create folder error:", e);
		return null;
	}
};

export const listPersonalDriveFolders = async () => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/folders`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to list folders");
		return data?.data?.folders || [];
	} catch (e) {
		console.error("Drive list folders error:", e);
		return [];
	}
};

export const sharePersonalDriveFolder = async (
	folderId,
	{ username, groupId, includeContents = true, role = "reader" }
) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(
			`${API_BASE_URL}/api/drive/folders/${folderId}/share`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ username, groupId, includeContents, role }),
			}
		);
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to share folder");
		return data;
	} catch (e) {
		console.error("Drive share folder error:", e);
		return { success: false, message: e.message };
	}
};

export const uploadPersonalDriveFiles = async (files, parentId) => {
	try {
		const token = localStorage.getItem("userToken");
		const form = new FormData();
		for (const f of files) form.append("files", f);
		if (parentId) form.append("parentId", parentId);
		const res = await fetch(`${API_BASE_URL}/api/drive/files`, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			body: form,
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to upload to Drive");
		return data;
	} catch (e) {
		console.error("Drive upload error:", e);
		return { success: false, message: e.message };
	}
};

// Upload with progress (uses XMLHttpRequest to get upload progress events)
export const uploadPersonalDriveFilesWithProgress = async (
	files,
	onProgress,
	parentId
) => {
	return new Promise((resolve) => {
		try {
			const token = localStorage.getItem("userToken");
			const form = new FormData();
			for (const f of files) form.append("files", f);
			if (parentId) form.append("parentId", parentId);

			const xhr = new XMLHttpRequest();
			xhr.open("POST", `${API_BASE_URL}/api/drive/files`);
			if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

			xhr.upload.onprogress = (evt) => {
				if (onProgress) {
					if (evt.lengthComputable) {
						const percent = Math.round((evt.loaded / evt.total) * 100);
						onProgress({
							phase: "upload",
							loaded: evt.loaded,
							total: evt.total,
							percent,
						});
					} else {
						onProgress({
							phase: "upload",
							loaded: evt.loaded,
							total: 0,
							percent: null,
						});
					}
				}
			};

			xhr.onreadystatechange = () => {
				if (xhr.readyState === 4) {
					try {
						const data = JSON.parse(xhr.responseText || "{}");
						resolve({
							success: xhr.status >= 200 && xhr.status < 300,
							...data,
						});
					} catch {
						resolve({ success: false, message: "Failed to parse response" });
					}
				}
			};

			xhr.onerror = () => resolve({ success: false, message: "Network error" });
			xhr.send(form);
		} catch (e) {
			console.error("Drive upload (progress) error:", e);
			resolve({ success: false, message: e.message });
		}
	});
};

// Upload a folder (directory) using input.webkitdirectory - pass the FileList as-is
export const uploadPersonalDriveFolder = async (fileList, parentId) => {
	// fileList here is an array-like of File with webkitRelativePath; server treats as regular files but parentId determines target
	return uploadPersonalDriveFiles(fileList, parentId);
};

export const deletePersonalDriveFile = async (fileId) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}`, {
			method: "DELETE",
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data.message || "Failed to delete file");
		return { success: true };
	} catch (e) {
		console.error("Drive delete error:", e);
		return { success: false, message: e.message };
	}
};

export const sharePersonalDriveFile = async (
	fileId,
	{ username, role = "reader" }
) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}/share`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ username, role }),
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to share file");
		return data;
	} catch (e) {
		console.error("Drive share error:", e);
		return { success: false, message: e.message };
	}
};

export const listDriveSharesSent = async () => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/shares/sent`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Failed to list sent shares");
		return data;
	} catch (e) {
		console.error("Drive list sent shares error:", e);
		return { success: false, message: e.message };
	}
};

export const listDriveSharesReceived = async () => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/shares/received`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		const data = await res.json();
		if (!res.ok)
			throw new Error(data.message || "Failed to list received shares");
		return data;
	} catch (e) {
		console.error("Drive list received shares error:", e);
		return { success: false, message: e.message };
	}
};

export const downloadPersonalDriveFile = async (fileId, fileName) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(
			`${API_BASE_URL}/api/drive/files/${fileId}/download`,
			{
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}
		);
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.message || "Failed to download file");
		}
		// Stream to blob then trigger download
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName || `file-${fileId}`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		return { success: true };
	} catch (e) {
		console.error("Drive download error:", e);
		return { success: false, message: e.message };
	}
};

// Download with progress
export const downloadPersonalDriveFileWithProgress = async (
	fileId,
	fileName,
	onProgress
) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(
			`${API_BASE_URL}/api/drive/files/${fileId}/download`,
			{
				headers: token ? { Authorization: `Bearer ${token}` } : undefined,
			}
		);
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.message || "Failed to download file");
		}
		const total = Number(res.headers.get("content-length")) || 0;
		const reader = res.body?.getReader ? res.body.getReader() : null;
		if (!reader) {
			// Fallback: no streaming, just blob
			const blob = await res.blob();
			if (onProgress)
				onProgress({
					phase: "download",
					loaded: blob.size,
					total,
					percent: 100,
				});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName || `file-${fileId}`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			return { success: true };
		}
		const chunks = [];
		let loaded = 0;
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				loaded += value.length || value.byteLength || 0;
				if (onProgress) {
					const percent = total ? Math.round((loaded / total) * 100) : null;
					onProgress({ phase: "download", loaded, total, percent });
				}
			}
		}
		const blob = new Blob(chunks);
		if (onProgress)
			onProgress({
				phase: "download",
				loaded,
				total: total || blob.size,
				percent: 100,
			});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName || `file-${fileId}`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
		return { success: true };
	} catch (e) {
		console.error("Drive download (progress) error:", e);
		return { success: false, message: e.message };
	}
};

export const viewPersonalDriveFile = async (fileId) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}/view`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.message || "Failed to open file");
		}
		const blob = await res.blob();
		return { success: true, blob };
	} catch (e) {
		console.error("Drive view error:", e);
		return { success: false, message: e.message };
	}
};

// View (open inline) with progress, returns a Blob when complete
export const viewPersonalDriveFileWithProgress = async (fileId, onProgress) => {
	try {
		const token = localStorage.getItem("userToken");
		const res = await fetch(`${API_BASE_URL}/api/drive/files/${fileId}/view`, {
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data.message || "Failed to open file");
		}
		const total = Number(res.headers.get("content-length")) || 0;
		const reader = res.body?.getReader ? res.body.getReader() : null;
		if (!reader) {
			const blob = await res.blob();
			if (onProgress)
				onProgress({ phase: "open", loaded: blob.size, total, percent: 100 });
			return { success: true, blob };
		}
		const chunks = [];
		let loaded = 0;
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				loaded += value.length || value.byteLength || 0;
				if (onProgress) {
					const percent = total ? Math.round((loaded / total) * 100) : null;
					onProgress({ phase: "open", loaded, total, percent });
				}
			}
		}
		const blob = new Blob(chunks);
		if (onProgress)
			onProgress({
				phase: "open",
				loaded,
				total: total || blob.size,
				percent: 100,
			});
		return { success: true, blob };
	} catch (e) {
		console.error("Drive view (progress) error:", e);
		return { success: false, message: e.message };
	}
};
