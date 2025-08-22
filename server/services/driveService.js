import { OAuth2Client } from "google-auth-library";
import User from "../models/userModel.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Reuse the same callback URL used by Passport, though it's not required for refresh flow
const REDIRECT_URI =
	process.env.GOOGLE_CALLBACK_URL ||
	"http://localhost:5000/api/auth/google/callback";

class DriveService {
	static getOAuthClient(user) {
		if (!user?.googleRefreshToken) {
			throw new Error(
				"Missing Google refresh token. Please sign in with Google again and grant access."
			);
		}
		const client = new OAuth2Client(
			GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET,
			REDIRECT_URI
		);
		client.setCredentials({ refresh_token: user.googleRefreshToken });
		return client;
	}

	static async getAccessToken(user) {
		const client = this.getOAuthClient(user);
		const { token } = await client.getAccessToken();
		if (!token) throw new Error("Failed to acquire Google access token");
		return token;
	}

	static async ensureUserFolder(user) {
		if (user.googleDriveFolderId) return user.googleDriveFolderId;

		const accessToken = await this.getAccessToken(user);

		// Try to find existing app folder first (drive.file limits to app-created files)
		const searchParams = new URLSearchParams({
			q: "mimeType = 'application/vnd.google-apps.folder' and name = 'College Notes - Personal' and trashed = false",
			fields: "files(id,name)",
			pageSize: "10",
		});
		const findRes = await fetch(
			`https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
			{ headers: { Authorization: `Bearer ${accessToken}` } }
		);
		if (findRes.ok) {
			const found = await findRes.json();
			if (found.files?.length) {
				const existing = found.files[0];
				user.googleDriveFolderId = existing.id;
				await user.save({ validateBeforeSave: false });
				return existing.id;
			}
		}

		// Create a dedicated folder for this app's personal uploads
		const metadata = {
			name: "College Notes - Personal",
			mimeType: "application/vnd.google-apps.folder",
		};

		const res = await fetch("https://www.googleapis.com/drive/v3/files", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(metadata),
		});

		if (!res.ok) {
			const text = await res.text();
			// Give a clearer hint when the Google token doesn't have drive.file scope
			try {
				const j = JSON.parse(text);
				const reason = j?.error?.details?.[0]?.reason || j?.error?.errors?.[0]?.reason;
				const msg = j?.error?.message || "Insufficient permissions";
				if (res.status === 403 && String(reason).includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT")) {
					throw new Error(
						`Google Drive access not granted for this account. Please reconnect Google from your Profile to grant Drive access (drive.file). If this still fails for non-developer accounts, ask the app owner to add you as a Test user in the Google OAuth consent screen or publish the app. Original: ${msg}`
					);
				}
			} catch (_) {
				// fall through to generic message
			}
			throw new Error(`Failed to create Drive folder: ${res.status} ${text}`);
		}

		const data = await res.json();
		user.googleDriveFolderId = data.id;
		await user.save({ validateBeforeSave: false });
		return data.id;
	}

	static async listFiles(user) {
		const accessToken = await this.getAccessToken(user);
		const folderId = await this.ensureUserFolder(user);

		const params = new URLSearchParams({
			q: `'${folderId}' in parents and trashed = false`,
			fields:
				"files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink)",
			pageSize: "100",
			orderBy: "modifiedTime desc",
		});

		const res = await fetch(
			`https://www.googleapis.com/drive/v3/files?${params.toString()}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to list Drive files: ${res.status} ${text}`);
		}

		const json = await res.json();
		return json.files || [];
	}

	static buildMultipartBody(metadata, mediaBuffer, mimeType) {
		const boundary = "-------314159265358979323846";
		const delimiter = `\r\n--${boundary}\r\n`;
		const closeDelimiter = `\r\n--${boundary}--`;

		const meta = Buffer.from(JSON.stringify(metadata), "utf8");
		const preamble =
			delimiter +
			"Content-Type: application/json; charset=UTF-8\r\n\r\n" +
			meta +
			"\r\n" +
			delimiter +
			`Content-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`;

		const end = closeDelimiter;
		return {
			body: Buffer.concat([
				Buffer.from(preamble, "utf8"),
				mediaBuffer,
				Buffer.from(end, "utf8"),
			]),
			boundary,
		};
	}

	static async uploadFile(user, file) {
		const accessToken = await this.getAccessToken(user);
		const folderId = await this.ensureUserFolder(user);

		const metadata = {
			name: file.originalname,
			parents: [folderId],
		};

		const { body, boundary } = this.buildMultipartBody(
			metadata,
			file.buffer,
			file.mimetype
		);

		const res = await fetch(
			"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,webContentLink",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": `multipart/related; boundary=${boundary}`,
				},
				body,
			}
		);

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to upload file to Drive: ${res.status} ${text}`);
		}

		return await res.json();
	}

	static async deleteFile(user, fileId) {
		const accessToken = await this.getAccessToken(user);
		const res = await fetch(
			`https://www.googleapis.com/drive/v3/files/${fileId}`,
			{
				method: "DELETE",
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);
		if (res.status === 204) return { success: true };
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to delete file: ${res.status} ${text}`);
		}
		return { success: true };
	}

	// Share a file with another user by email, role can be reader/commenter/writer
	static async shareFile(user, { fileId, recipientEmail, role = "reader" }) {
		const accessToken = await this.getAccessToken(user);
		const body = {
			role,
			type: "user",
			emailAddress: recipientEmail,
		};
		const res = await fetch(
			`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			}
		);
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to share file: ${res.status} ${text}`);
		}
		return await res.json();
	}
}

export default DriveService;
