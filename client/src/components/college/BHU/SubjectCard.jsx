import React, { useState, useEffect } from "react";
import FileList from "./FileList";
import { listFilesByCategory } from "../../../services/apiService";

const SubjectCard = ({ subject, courseId, semester }) => {
	const [activeTab, setActiveTab] = useState("notes");
	const [files, setFiles] = useState({ notes: [], pyqs: [] });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Fetch files from S3 based on subject and course
	useEffect(() => {
		const fetchFiles = async () => {
			setLoading(true);
			setError(null);

			try {
				// Generate normalized subject name for API query
				const normalizedSubject = subject.name
					.toLowerCase()
					.replace(/\s+/g, "-");

				console.log("🔍 Fetching files for:", {
					college: "bhu",
					course: courseId,
					semester: semester,
					subject: normalizedSubject,
					originalSubject: subject.name,
				});

				// Fetch files for both notes and previous year questions
				const [notesResult, pyqsResult] = await Promise.all([
					listFilesByCategory({
						college: "bhu",
						course: courseId,
						semester: semester,
						subject: normalizedSubject,
						type: "notes",
					}),
					listFilesByCategory({
						college: "bhu",
						course: courseId,
						semester: semester,
						subject: normalizedSubject,
						type: "pyqs",
					}),
				]);

				console.log("📁 API Results:", { notesResult, pyqsResult });

				const newFiles = {
					notes: notesResult.success ? notesResult.files : [],
					pyqs: pyqsResult.success ? pyqsResult.files : [],
				};

				setFiles(newFiles);

				// Log final files count
				console.log("📊 Final files count:", {
					notes: newFiles.notes.length,
					pyqs: newFiles.pyqs.length,
				});
			} catch (err) {
				console.error("❌ Error fetching files:", err);
				setError("Failed to load files");
				// Fallback to dummy files on error
				setFiles({
					notes: [
						`${subject.name} - Chapter 1 Introduction.pdf`,
						`${subject.name} - Chapter 2 Fundamentals.pdf`,
						`${subject.name} - Chapter 3 Advanced Topics.pdf`,
						`${subject.name} - Lecture Notes Complete.pdf`,
						`${subject.name} - Quick Reference Guide.pdf`,
					],
					pyqs: [
						`${subject.name} - End Semester Exam 2023.pdf`,
						`${subject.name} - End Semester Exam 2022.pdf`,
						`${subject.name} - Mid Semester Exam 2023.pdf`,
						`${subject.name} - Mid Semester Exam 2022.pdf`,
						`${subject.name} - Sample Question Paper.pdf`,
					],
				});
			} finally {
				setLoading(false);
			}
		};

		fetchFiles();
	}, [subject.name, courseId, semester]);

	// Generate subject code based on course and subject name
	const generateSubjectCode = () => {
		const courseCode = courseId.substring(0, 3).toUpperCase();
		const subjectNumber = subject.name.match(/\d+/)
			? subject.name.match(/\d+/)[0]
			: "001";
		return `${courseCode}${subjectNumber}`;
	};

	return (
		<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
			{/* Subject Header */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-3">
					<h4 className="text-lg font-bold text-gray-800">{subject.name}</h4>
					<span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
						{generateSubjectCode()}
					</span>
				</div>

				<div className="flex flex-wrap gap-2 text-xs">
					<span className="bg-red-100 text-red-800 px-2 py-1 rounded">BHU</span>
					<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
						{courseId.toUpperCase()}
					</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex space-x-2 mb-4 border-b-2 border-gray-100">
				<button
					onClick={() => setActiveTab("notes")}
					className={`py-3 px-4 font-medium text-sm transition-all duration-300 ${
						activeTab === "notes"
							? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
							: "text-gray-600 hover:text-blue-600 hover:bg-blue-25"
					}`}
				>
					<span className="flex items-center gap-2">
						📝 Notes
						{loading ? (
							<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs animate-pulse">
								...
							</span>
						) : (
							<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
								{files.notes.length}
							</span>
						)}
					</span>
				</button>
				<button
					onClick={() => setActiveTab("pyqs")}
					className={`py-3 px-4 font-medium text-sm transition-all duration-300 ${
						activeTab === "pyqs"
							? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
							: "text-gray-600 hover:text-blue-600 hover:bg-blue-25"
					}`}
				>
					<span className="flex items-center gap-2">
						📄 PYQs
						{loading ? (
							<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs animate-pulse">
								...
							</span>
						) : (
							<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
								{files.pyqs.length}
							</span>
						)}
					</span>
				</button>
			</div>

			{/* File List */}
			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div className="flex items-center space-x-2">
						<svg
							className="animate-spin h-5 w-5 text-blue-600"
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
						<span className="text-gray-600">Loading files from AWS S3...</span>
					</div>
				</div>
			) : error ? (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
					<div className="flex items-center space-x-2">
						<div className="text-yellow-600">⚠️</div>
						<div>
							<div className="text-sm font-medium text-yellow-800">
								Using Demo Files
							</div>
							<div className="text-xs text-yellow-600">
								Real files will be loaded from AWS S3 when available
							</div>
						</div>
					</div>
				</div>
			) : files[activeTab].length === 0 ? (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
					<div className="flex items-center space-x-2">
						<div className="text-blue-600">💡</div>
						<div>
							<div className="text-sm font-medium text-blue-800">
								No Files Found
							</div>
							<div className="text-xs text-blue-600">
								Upload files to see them appear here
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-4">
					<div className="flex items-center space-x-2">
						<div className="text-green-600 text-xs">✅</div>
						<div className="text-xs text-green-700">
							Loaded {files[activeTab].length} file(s) from AWS S3
						</div>
					</div>
				</div>
			)}

			<FileList files={files[activeTab]} />
		</div>
	);
};

export default SubjectCard;
