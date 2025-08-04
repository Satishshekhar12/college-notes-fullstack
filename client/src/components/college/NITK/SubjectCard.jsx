import React, { useState, useEffect } from "react";
import FileList from "./FileList";
import { listFilesByCategory } from "../../../services/apiService";

const SubjectCard = ({ subject, college = "NITK", course, semester }) => {
	const [activeTab, setActiveTab] = useState("notes");
	const [files, setFiles] = useState({
		notes: [],
		pyqs: [],
		assignments: [],
		others: [],
		"current-semester-2025": [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch files from database when component mounts or parameters change
	useEffect(() => {
		const fetchFiles = async () => {
			try {
				setLoading(true);
				setError(null);

				const baseParams = {
					college: college.toLowerCase(), // Convert to lowercase for API
					course: course, // Keep original case (chemicalEngineering matches DB)
					semester: String(semester), // Ensure string format
					subject: subject.code || subject.name, // Use code (CH701) or name as fallback
				};

				console.log("🔍 NITK SubjectCard base params:", baseParams);

				// Fetch files for all types with individual logging
				console.log("📡 Making API calls for different types...");
				const [
					notesResult,
					pyqsResult,
					assignmentsResult,
					othersResult,
					currentSemesterResult,
				] = await Promise.all([
					listFilesByCategory({ ...baseParams, type: "notes" }).then(
						(result) => {
							console.log("📝 Notes API call:", {
								params: { ...baseParams, type: "notes" },
								result,
							});
							return result;
						}
					),
					listFilesByCategory({ ...baseParams, type: "pyqs" }).then(
						(result) => {
							console.log("📄 PYQs API call:", {
								params: { ...baseParams, type: "pyqs" },
								result,
							});
							return result;
						}
					),
					listFilesByCategory({ ...baseParams, type: "assignments" }).then(
						(result) => {
							console.log("📋 Assignments API call:", {
								params: { ...baseParams, type: "assignments" },
								result,
							});
							return result;
						}
					),
					listFilesByCategory({ ...baseParams, type: "others" }).then(
						(result) => {
							console.log("📁 Others API call:", {
								params: { ...baseParams, type: "others" },
								result,
							});
							return result;
						}
					),
					listFilesByCategory({
						...baseParams,
						type: "current-semester-2025",
					}).then((result) => {
						console.log("📅 Current Semester API call:", {
							params: { ...baseParams, type: "current-semester-2025" },
							result,
						});
						return result;
					}),
				]);

				console.log("📁 NITK API Results:", {
					notesResult,
					pyqsResult,
					assignmentsResult,
					othersResult,
					currentSemesterResult,
				});

				setFiles({
					notes: notesResult.success ? notesResult.files : [],
					pyqs: pyqsResult.success ? pyqsResult.files : [],
					assignments: assignmentsResult.success ? assignmentsResult.files : [],
					others: othersResult.success ? othersResult.files : [],
					"current-semester-2025": currentSemesterResult.success
						? currentSemesterResult.files
						: [],
				});

				console.log("📊 NITK Final files count:", {
					notes: notesResult.success ? notesResult.files.length : 0,
					pyqs: pyqsResult.success ? pyqsResult.files.length : 0,
					assignments: assignmentsResult.success
						? assignmentsResult.files.length
						: 0,
					others: othersResult.success ? othersResult.files.length : 0,
					"current-semester-2025": currentSemesterResult.success
						? currentSemesterResult.files.length
						: 0,
				});
			} catch (error) {
				console.error("❌ NITK Error fetching files:", error);
				setError("Failed to load files");
				setFiles({
					notes: [],
					pyqs: [],
					assignments: [],
					others: [],
					"current-semester-2025": [],
				});
			} finally {
				setLoading(false);
			}
		};

		// Only fetch if we have the required parameters
		if (college && course && semester && subject) {
			fetchFiles();
		}
	}, [college, course, semester, subject]);

	// Get total file count for a tab
	const getFileCount = (tabName) => {
		return files[tabName]?.length || 0;
	};

	return (
		<div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 md:p-6">
			{/* Subject Header */}
			<div className="mb-3 md:mb-4">
				<h4 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
					{subject.name}
				</h4>
				<div className="flex flex-wrap gap-1 md:gap-2 text-xs">
					<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
						{subject.code}
					</span>
					<span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
						{subject.credits} Credits
					</span>
					<span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
						{subject.type}
					</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="mb-4 md:mb-6">
				<div className="flex flex-wrap gap-2 md:gap-3 pb-3">
					{/* Current Semester - Always visible */}
					<button
						onClick={() => setActiveTab("current-semester-2025")}
						className={`relative py-3 px-4 md:px-6 font-semibold text-xs md:text-sm rounded-xl transition-all duration-300 backdrop-blur-sm border ${
							activeTab === "current-semester-2025"
								? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border-blue-300/50 shadow-lg shadow-blue-500/25"
								: "bg-white/40 text-gray-700 border-gray-200/50 hover:bg-gradient-to-r hover:from-blue-400/10 hover:to-purple-400/10 hover:text-blue-600 hover:border-blue-200/60 hover:shadow-md"
						}`}
					>
						<span className="flex items-center gap-1">
							📅 2025 Semester
							{/* <span className=" md:inline">Current Semester</span> */}
							<span className="bg-blue-100/80 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold ml-1">
								{getFileCount("current-semester-2025")}
							</span>
						</span>
					</button>

					{/* Notes - Always visible */}
					<button
						onClick={() => setActiveTab("notes")}
						className={`relative py-3 px-4 md:px-6 font-semibold text-xs md:text-sm rounded-xl transition-all duration-300 backdrop-blur-sm border ${
							activeTab === "notes"
								? "bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-700 border-green-300/50 shadow-lg shadow-green-500/25"
								: "bg-white/40 text-gray-700 border-gray-200/50 hover:bg-gradient-to-r hover:from-green-400/10 hover:to-blue-400/10 hover:text-green-600 hover:border-green-200/60 hover:shadow-md"
						}`}
					>
						<span className="flex items-center gap-1">
							📝 Old Notes
							<span className="bg-green-100/80 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold ml-1">
								{getFileCount("notes")}
							</span>
						</span>
					</button>

					{/* PYQs - Always visible */}
					<button
						onClick={() => setActiveTab("pyqs")}
						className={`relative py-3 px-4 md:px-6 font-semibold text-xs md:text-sm rounded-xl transition-all duration-300 backdrop-blur-sm border ${
							activeTab === "pyqs"
								? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-700 border-orange-300/50 shadow-lg shadow-orange-500/25"
								: "bg-white/40 text-gray-700 border-gray-200/50 hover:bg-gradient-to-r hover:from-orange-400/10 hover:to-red-400/10 hover:text-orange-600 hover:border-orange-200/60 hover:shadow-md"
						}`}
					>
						<span className="flex items-center gap-1">
							📄 PYQs
							<span className="bg-orange-100/80 text-orange-800 px-2 py-0.5 rounded-full text-xs font-bold ml-1">
								{getFileCount("pyqs")}
							</span>
						</span>
					</button>

					{/* Others - Show only when files exist */}
					{getFileCount("others") > 0 && (
						<button
							onClick={() => setActiveTab("others")}
							className={`relative py-3 px-4 md:px-6 font-semibold text-xs md:text-sm rounded-xl transition-all duration-300 backdrop-blur-sm border ${
								activeTab === "others"
									? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 border-purple-300/50 shadow-lg shadow-purple-500/25"
									: "bg-white/40 text-gray-700 border-gray-200/50 hover:bg-gradient-to-r hover:from-purple-400/10 hover:to-pink-400/10 hover:text-purple-600 hover:border-purple-200/60 hover:shadow-md"
							}`}
						>
							<span className="flex items-center gap-1">
								📁 Others
								<span className="bg-purple-100/80 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold ml-1">
									{getFileCount("others")}
								</span>
							</span>
						</button>
					)}

					{/* Assignments - Show only when files exist */}
					{getFileCount("assignments") > 0 && (
						<button
							onClick={() => setActiveTab("assignments")}
							className={`relative py-3 px-4 md:px-6 font-semibold text-xs md:text-sm rounded-xl transition-all duration-300 backdrop-blur-sm border ${
								activeTab === "assignments"
									? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-700 border-indigo-300/50 shadow-lg shadow-indigo-500/25"
									: "bg-white/40 text-gray-700 border-gray-200/50 hover:bg-gradient-to-r hover:from-indigo-400/10 hover:to-blue-400/10 hover:text-indigo-600 hover:border-indigo-200/60 hover:shadow-md"
							}`}
						>
							<span className="flex items-center gap-1">
								📋 <span className="hidden md:inline">Assignments</span>
								<span className="bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded-full text-xs font-bold ml-1">
									{getFileCount("assignments")}
								</span>
							</span>
						</button>
					)}
				</div>
			</div>

			{/* Loading State */}
			{loading && (
				<div className="flex justify-center items-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span className="ml-2 text-gray-600">Loading files...</span>
				</div>
			)}

			{/* Error State */}
			{error && !loading && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
					<p className="text-sm">⚠️ {error}</p>
					<p className="text-xs mt-1">
						Please check your connection and try again.
					</p>
				</div>
			)}

			{/* File List */}
			{!loading && !error && <FileList files={files[activeTab] || []} />}

			{/* Empty State */}
			{!loading &&
				!error &&
				(!files[activeTab] || files[activeTab].length === 0) && (
					<div className="text-center py-8 text-gray-500">
						<p className="text-sm">📂 No {activeTab} found for this subject.</p>
						<p className="text-xs mt-1">
							Files will appear here once uploaded.
						</p>
					</div>
				)}
		</div>
	);
};

export default SubjectCard;
