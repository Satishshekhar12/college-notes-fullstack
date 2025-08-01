// AWS Configuration using AWS SDK v3
import { S3Client } from "@aws-sdk/client-s3";

// Create S3 Client instance
const s3Client = new S3Client({
	region: import.meta.env.VITE_AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
		secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
	},
});

// Get the bucket name from environment variables
export const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;

export { s3Client };
export default s3Client;
