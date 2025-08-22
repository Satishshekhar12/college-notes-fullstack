import React, { useEffect, useRef, useState } from "react";
import {
	listPersonalDriveFiles,
	uploadPersonalDriveFilesWithProgress,
	deletePersonalDriveFile,
	sharePersonalDriveFile,
	listDriveSharesSent,
	listDriveSharesReceived,
	downloadPersonalDriveFileWithProgress,
	viewPersonalDriveFileWithProgress,
} from "../../services/apiService";
import { startGoogleLogin } from "../../services/userService";

const PersonalDrive = ({ isGoogleLinked }) => {
	const [files, setFiles] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState({ phase: null, percent: 0, loaded: 0, total: 0 });
	const [processing, setProcessing] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [sharesSent, setSharesSent] = useState([]);
	const [sharesReceived, setSharesReceived] = useState([]);
	const fileInputRef = useRef(null);

	const formatBytes = (bytes) => {
		if (!bytes && bytes !== 0) return "";
		const sizes = ["B", "KB", "MB", "GB", "TB"];
		const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
	};

	const fetchFiles = async () => {
		setLoading(true);
		setError("");
		const res = await listPersonalDriveFiles();
		if (res.success) setFiles(res.data.files || []);
		else setError(res.message || "Failed to load Drive files");
		setLoading(false);
	};

	const fetchShares = async () => {
		const [sent, received] = await Promise.all([
			listDriveSharesSent(),
			listDriveSharesReceived(),
		]);
		if (sent.success) setSharesSent(sent.data.shares || []);
		if (received.success) setSharesReceived(received.data.shares || []);
	};

	useEffect(() => {
		if (isGoogleLinked) {
			fetchFiles();
			fetchShares();
		}
	}, [isGoogleLinked]);

	const doUpload = async (selected) => {
		if (!selected.length) return;
		setError("");
		setSuccess("");
		setUploading(true);
		setProcessing(true);
		setProgress({ phase: "upload", percent: 0, loaded: 0, total: 0 });
		const res = await uploadPersonalDriveFilesWithProgress(selected, (p) => setProgress(p));
		if (res.success) {
			setSuccess("Uploaded successfully");
			await fetchFiles();
			setTimeout(() => setSuccess(""), 1500);
		} else {
			setError(res.message || "Upload failed");
		}
		setUploading(false);
		setProcessing(false);
	};

	const onUpload = async (e) => {
		const selected = Array.from(e.target.files || []);
		await doUpload(selected);
	};

	const onDrop = async (e) => {
		e.preventDefault();
		setDragOver(false);
		const dropped = Array.from(e.dataTransfer.files || []);
		await doUpload(dropped);
	};

	const onDelete = async (id) => {
		setError("");
		const res = await deletePersonalDriveFile(id);
		if (!res.success) {
			setError(res.message || "Failed to delete file");
		} else {
			await fetchFiles();
		}
	};

	const onShare = async (file) => {
		const username = window.prompt("Enter username to share with:");
		if (!username) return;
		const res = await sharePersonalDriveFile(file.id, { username });
		if (!res.success) setError(res.message || "Failed to share file");
		else {
			setSuccess(`Shared '${file.name}' with ${username}`);
			setTimeout(() => setSuccess(""), 1500);
			await fetchShares();
		}
	};

	const onDownload = async (file) => {
		setError("");
		setProcessing(true);
		setProgress({ phase: "download", percent: 0, loaded: 0, total: Number(file.size) || 0 });
		const res = await downloadPersonalDriveFileWithProgress(file.id, file.name, (p) => setProgress(p));
		setProcessing(false);
		if (!res.success) setError(res.message || "Failed to download file");
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Personal Drive</h3>
				<div className="flex items-center gap-3">
					<button
						onClick={fetchFiles}
						className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200"
					>
						Refresh
					</button>
					<label
						className={`px-3 py-2 text-white rounded cursor-pointer ${
							!isGoogleLinked || uploading
								? "bg-teal-300 cursor-not-allowed"
								: "bg-teal-600 hover:bg-teal-700"
						}`}
						aria-disabled={!isGoogleLinked || uploading}
					>
						{uploading ? "Uploading..." : "Upload Files"}
						<input
							ref={fileInputRef}
							type="file"
							multiple
							className="hidden"
							onChange={onUpload}
							disabled={!isGoogleLinked || uploading}
						/>
					</label>
				</div>
			</div>

			{!isGoogleLinked && (
				<div className="p-4 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
					<span>
						Connect your account with Google to enable Personal Drive uploads.
					</span>
					<button
						onClick={startGoogleLogin}
						className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
					>
						Connect Google
					</button>
				</div>
			)}

			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) =>
					!isGoogleLinked || uploading ? e.preventDefault() : onDrop(e)
				}
				onClick={() => {
					if (isGoogleLinked && !uploading) fileInputRef.current?.click();
				}}
				className={`border-2 border-dashed rounded p-6 text-center ${
					dragOver ? "border-teal-500 bg-teal-50" : "border-gray-300"
				} ${
					!isGoogleLinked || uploading
						? "opacity-60 cursor-not-allowed"
						: "cursor-pointer"
				}`}
			>
				<div className="text-center text-gray-600">
					{isGoogleLinked
						? "Drag and drop files here or click to choose files"
						: "Connect Google to upload. You can still view this area but it’s disabled."}
				</div>
			</div>

			{error && (
				<div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
					{error}
				</div>
			)}
			{success && (
				<div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded">
					{success}
				</div>
			)}

			{loading ? (
				<div className="text-gray-600">Loading...</div>
			) : files.length ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{files.map((f) => (
						<div key={f.id} className="p-3 border rounded bg-white">
							<div className="font-medium truncate">{f.name}</div>
							<div className="text-sm text-gray-600">
								{(Number(f.size || 0) / (1024 * 1024)).toFixed(2)} MB •{" "}
								{new Date(f.modifiedTime).toLocaleString()}
							</div>
							<div className="mt-2 flex gap-2">
								<button
									onClick={async () => {
										setError("");
										setProcessing(true);
										setProgress({ phase: "open", percent: 0, loaded: 0, total: Number(f.size) || 0 });
										const r = await viewPersonalDriveFileWithProgress(f.id, (p) => setProgress(p));
										setProcessing(false);
										if (!r.success) return setError(r.message || "Failed to open file");
										const url = URL.createObjectURL(r.blob);
										window.location.href = url;
									}}
									className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
								>
									Open
								</button>
								<button
									onClick={() => onDownload(f)}
									className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
								>
									Download
								</button>
								<button
									onClick={() => onShare(f)}
									className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
								>
									Share
								</button>
								<button
									onClick={() => onDelete(f.id)}
									className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="text-gray-600">
					No files yet. Upload to get started.
				</div>
			)}

			{/* Shares sections */}
			<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="p-4 border rounded bg-white">
					<div className="font-semibold mb-2">I shared</div>
					{sharesSent.length ? (
						<ul className="space-y-2">
							{sharesSent.map((s) => (
								<li key={`${s.fileId}-${s.recipientUser}`} className="text-sm flex items-center justify-between">
									<div className="truncate">
										<div className="font-medium truncate">{s.fileName || s.fileId}</div>
										<div className="text-gray-600">to @{s.recipientUsername} • {new Date(s.sharedAt).toLocaleString()}</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={async () => {
												setError("");
												setProcessing(true);
												setProgress({ phase: "open", percent: 0, loaded: 0, total: 0 });
												const r = await viewPersonalDriveFileWithProgress(s.fileId, (p) => setProgress(p));
												setProcessing(false);
												if (!r.success) return setError(r.message || "Failed to open file");
												const url = URL.createObjectURL(r.blob);
												window.location.href = url;
											}}
											className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
										>
											Open
										</button>
										<button
											onClick={async () => {
												setError("");
																							setProcessing(true);
																							setProgress({ phase: "download", percent: 0, loaded: 0, total: 0 });
																							const r = await downloadPersonalDriveFileWithProgress(
																								s.fileId,
																								s.fileName || `file-${s.fileId}`,
																								(p) => setProgress(p)
																							);
																							setProcessing(false);
																							if (!r.success) setError(r.message || "Failed to download file");
											}}
											className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
										>
											Download
										</button>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="text-sm text-gray-600">No shares yet.</div>
					)}
				</div>
				<div className="p-4 border rounded bg-white">
					<div className="font-semibold mb-2">Shared with me</div>
					{sharesReceived.length ? (
						<ul className="space-y-2">
							{sharesReceived.map((s) => (
								<li key={`${s.fileId}-${s.ownerUser}`} className="text-sm flex items-center justify-between">
									<div className="truncate">
										<div className="font-medium truncate">{s.fileName || s.fileId}</div>
										<div className="text-gray-600">from @{s.ownerUsername} • {new Date(s.sharedAt).toLocaleString()}</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											onClick={async () => {
												setError("");
												setProcessing(true);
												setProgress({ phase: "open", percent: 0, loaded: 0, total: 0 });
												const r = await viewPersonalDriveFileWithProgress(s.fileId, (p) => setProgress(p));
												setProcessing(false);
												if (!r.success) return setError(r.message || "Failed to open file");
												const url = URL.createObjectURL(r.blob);
												window.location.href = url;
											}}
											className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
										>
											Open
										</button>
										<button
											onClick={async () => {
												setError("");
												setProcessing(true);
												setProgress({ phase: "download", percent: 0, loaded: 0, total: 0 });
												const r = await downloadPersonalDriveFileWithProgress(s.fileId, s.fileName || `file-${s.fileId}`,(p)=> setProgress(p));
												setProcessing(false);
												if (!r.success) setError(r.message || "Failed to download file");
											}}
											className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
										>
											Download
										</button>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="text-sm text-gray-600">No files shared with you yet.</div>
					)}
				</div>
			</div>

			{/* Processing popup with progress */}
			{processing && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
					<div className="bg-white rounded shadow-lg w-[90%] max-w-md p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="font-semibold capitalize">
								{progress.phase === "upload" && "Uploading"}
								{progress.phase === "download" && "Downloading"}
								{progress.phase === "open" && "Opening"}
							</div>
						</div>
						<div className="mb-2 text-sm text-gray-600">
							{progress.total
								? `${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}${
									  progress.percent != null ? ` • ${progress.percent}%` : ""
								  }`
								: progress.loaded
								? `${formatBytes(progress.loaded)} downloaded`
								: "Processing..."}
						</div>
						<div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
							{progress.percent != null ? (
								<div
									className="h-full bg-teal-600"
									style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
								/>
							) : (
								<div className="h-full w-1/2 bg-teal-600 animate-pulse" />
							)}
						</div>
						<div className="mt-3 text-xs text-gray-500">
							Don’t close this window while {progress.phase || "processing"}.
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default PersonalDrive;
