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
				const [notesResult, pyqsResult, assignmentsResult, othersResult] =
					await Promise.all([
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
					]);

				console.log("📁 NITK API Results:", {
					notesResult,
					pyqsResult,
					assignmentsResult,
					othersResult,
				});

				setFiles({
					notes: notesResult.success ? notesResult.files : [],
					pyqs: pyqsResult.success ? pyqsResult.files : [],
					assignments: assignmentsResult.success ? assignmentsResult.files : [],
					others: othersResult.success ? othersResult.files : [],
				});

				console.log("📊 NITK Final files count:", {
					notes: notesResult.success ? notesResult.files.length : 0,
					pyqs: pyqsResult.success ? pyqsResult.files.length : 0,
					assignments: assignmentsResult.success
						? assignmentsResult.files.length
						: 0,
					others: othersResult.success ? othersResult.files.length : 0,
				});
			} catch (error) {
				console.error("❌ NITK Error fetching files:", error);
				setError("Failed to load files");
				setFiles({
					notes: [],
					pyqs: [],
					assignments: [],
					others: [],
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
		<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
			{/* Subject Header */}
			<div className="mb-4">
				<h4 className="text-lg font-semibold text-gray-800 mb-2">
					{subject.name}
				</h4>
				<div className="flex flex-wrap gap-2 text-xs">
					<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
						{subject.code}
					</span>
					<span className="bg-green-100 text-green-800 px-2 py-1 rounded">
						{subject.credits} Credits
					</span>
					<span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
						{subject.type}
					</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex space-x-2 mb-4 border-b">
				<button
					onClick={() => setActiveTab("notes")}
					className={`py-2 px-4 font-medium text-sm transition-colors ${
						activeTab === "notes"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					📝 Notes ({getFileCount("notes")})
				</button>
				<button
					onClick={() => setActiveTab("pyqs")}
					className={`py-2 px-4 font-medium text-sm transition-colors ${
						activeTab === "pyqs"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					📄 PYQs ({getFileCount("pyqs")})
				</button>
				{/* for current semester 	{
		id: "current-semester-2025",
		name: "Current Semester (2025)",
		description: "Materials specific to the current semester",
		requiresSemester: true,
		icon: "📅",
	}, */}
				{/* 
				<button
					onClick={() => setActiveTab("current-semester-2025")}
					className={`py-2 px-4 font-medium text-sm transition-colors ${
						activeTab === "current-semester-2025"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					📅 Current Semester (2025) ({getFileCount("current-semester-2025")})
				</button> */}

				{/* {getFileCount("others") > 0 && ( */}

				<button
					onClick={() => setActiveTab("others")}
					className={`py-2 px-4 font-medium text-sm transition-colors ${
						activeTab === "others"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					📁 Others ({getFileCount("others")})
				</button>
				{/* )} */}
				{getFileCount("assignments") > 0 && (
					<button
						onClick={() => setActiveTab("assignments")}
						className={`py-2 px-4 font-medium text-sm transition-colors ${
							activeTab === "assignments"
								? "text-blue-600 border-b-2 border-blue-600"
								: "text-gray-600 hover:text-blue-600"
						}`}
					>
						📋 Assignments ({getFileCount("assignments")})
					</button>
				)}

				{/* <button
					onClick={() => setActiveTab("assignments")}
					className={`py-2 px-4 font-medium text-sm transition-colors ${
						activeTab === "assignments"
							? "text-blue-600 border-b-2 border-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					📋 Assignments({getFileCount("oassignments)})
				</button> */}
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
