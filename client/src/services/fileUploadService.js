import s3Client, { bucketName } from "../utils/awsConfig.js";
import {
	PutObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Generate S3 key for uploaded file based on upload configuration
 * @param {File} file - The file being uploaded
 * @param {Object} uploadConfig - Upload configuration object
 * @returns {string} - S3 key for the file
 */

export const generateS3Key = (file, uploadConfig) => {
	const timestamp = Date.now();
	const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

	let key = `${uploadConfig.college}/${uploadConfig.course}`;

	// Add subcourse for BHU structure
	if (uploadConfig.subcourse) {
		key += `/${uploadConfig.subcourse}`;
	}

	// Add semester if available
	if (uploadConfig.semester) {
		key += `/semester-${uploadConfig.semester}`;
	}

	// Add subject if available
	if (uploadConfig.subject) {
		const subjectIdentifier =
			uploadConfig.subject.code ||
			uploadConfig.subject.name ||
			uploadConfig.subject;
		key += `/${subjectIdentifier}`;
	}

	// Add upload type and file
	key += `/${uploadConfig.uploadType}/${timestamp}_${sanitizedFileName}`;

	return key;
};

/**
 * Upload a single file to S3
 * @param {File} file - The file to upload
 * @param {string} key - S3 key for the file
 * @param {Object} options - Additional upload options
 * @returns {Promise} - Upload result
 */
export const uploadFileToS3 = async (file, key, options = {}) => {
	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: file,
		ContentType: file.type,
		ACL: options.acl || "private", // Use 'public-read' for public access
		Metadata: {
			originalName: file.name,
			uploadedAt: new Date().toISOString(),
			...options.metadata,
		},
	});

	try {
		const result = await s3Client.send(command);
		return {
			success: true,
			data: {
				originalName: file.name,
				s3Key: key,
				s3Url: `https://${bucketName}.s3.amazonaws.com/${key}`,
				eTag: result.ETag,
				size: file.size,
				contentType: file.type,
				uploadedAt: new Date().toISOString(),
			},
		};
	} catch (error) {
		console.error("S3 Upload Error:", error);
		return {
			success: false,
			error: error.message || "Upload failed",
		};
	}
};

/**
 * Upload multiple files to S3
 * @param {FileList|Array} files - Files to upload
 * @param {Object} uploadConfig - Upload configuration
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} - Array of upload results
 */
export const uploadMultipleFilesToS3 = async (
	files,
	uploadConfig,
	onProgress
) => {
	const fileArray = Array.from(files);
	const results = [];

	for (let i = 0; i < fileArray.length; i++) {
		const file = fileArray[i];
		const key = generateS3Key(file, uploadConfig);

		try {
			// Call progress callback
			if (onProgress) {
				onProgress({
					currentFile: i + 1,
					totalFiles: fileArray.length,
					fileName: file.name,
					status: "uploading",
				});
			}

			const result = await uploadFileToS3(file, key, {
				metadata: {
					uploadIndex: i.toString(),
					totalFiles: fileArray.length.toString(),
				},
			});

			results.push(result);

			// Update progress
			if (onProgress) {
				onProgress({
					currentFile: i + 1,
					totalFiles: fileArray.length,
					fileName: file.name,
					status: result.success ? "completed" : "failed",
				});
			}
		} catch (error) {
			console.error(`Failed to upload ${file.name}:`, error);
			results.push({
				success: false,
				error: error.message,
				fileName: file.name,
			});
		}
	}

	return results;
};

/**
 * Delete file from S3
 * @param {string} key - S3 key of the file to delete
 * @returns {Promise} - Deletion result
 */
export const deleteFileFromS3 = async (key) => {
	const command = new DeleteObjectCommand({
		Bucket: bucketName,
		Key: key,
	});

	try {
		await s3Client.send(command);
		return { success: true };
	} catch (error) {
		console.error("S3 Delete Error:", error);
		return {
			success: false,
			error: error.message || "Delete failed",
		};
	}
};

/**
 * Generate presigned URL for secure file access
 * @param {string} key - S3 key of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {string} - Presigned URL
 */
export const generatePresignedUrl = async (key, expiresIn = 3600) => {
	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: key,
	});

	try {
		return await getSignedUrl(s3Client, command, { expiresIn });
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		return null;
	}
};

/**
 * Get file metadata from S3
 * @param {string} key - S3 key of the file
 * @returns {Promise} - File metadata
 */
export const getFileMetadata = async (key) => {
	const command = new HeadObjectCommand({
		Bucket: bucketName,
		Key: key,
	});

	try {
		const result = await s3Client.send(command);
		return {
			success: true,
			data: {
				contentLength: result.ContentLength,
				contentType: result.ContentType,
				lastModified: result.LastModified,
				eTag: result.ETag,
				metadata: result.Metadata,
			},
		};
	} catch (error) {
		console.error("Error getting file metadata:", error);
		return {
			success: false,
			error: error.message || "Failed to get metadata",
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
