import React, { useState, useEffect } from "react";
import FileList from "./FileList";
import { listFilesByCategory } from "../../../services/apiService";

const SubjectCard = ({ subject, courseId, semester }) => {
	const [activeTab, setActiveTab] = useState("notes");
	// Optional sort helpers
	const [professorQuery, setProfessorQuery] = useState("");
	const [yearQuery, setYearQuery] = useState("");
	const [files, setFiles] = useState({
		notes: [],
		pyqs: [],
		assignments: [],
		others: [],
		"current-semester-2025": [],
	});
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

				// Fetch files for all types
				const [
					notesResult,
					pyqsResult,
					assignmentsResult,
					othersResult,
					currentSemesterResult,
				] = await Promise.all([
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
					listFilesByCategory({
						college: "bhu",
						course: courseId,
						semester: semester,
						subject: normalizedSubject,
						type: "assignments",
					}),
					listFilesByCategory({
						college: "bhu",
						course: courseId,
						semester: semester,
						subject: normalizedSubject,
						type: "others",
					}),
					listFilesByCategory({
						college: "bhu",
						course: courseId,
						semester: semester,
						subject: normalizedSubject,
						type: "current-semester-2025",
					}),
				]);

				console.log("📁 API Results:", {
					notesResult,
					pyqsResult,
					assignmentsResult,
					othersResult,
					currentSemesterResult,
				});

				const newFiles = {
					notes: notesResult.success ? notesResult.files : [],
					pyqs: pyqsResult.success ? pyqsResult.files : [],
					assignments: assignmentsResult.success ? assignmentsResult.files : [],
					others: othersResult.success ? othersResult.files : [],
					"current-semester-2025": currentSemesterResult.success
						? currentSemesterResult.files
						: [],
				};

				setFiles(newFiles);

				// Log final files count
				console.log("📊 Final files count:", {
					notes: newFiles.notes.length,
					pyqs: newFiles.pyqs.length,
					assignments: newFiles.assignments.length,
					others: newFiles.others.length,
					"current-semester-2025": newFiles["current-semester-2025"].length,
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
					assignments: [],
					others: [],
					"current-semester-2025": [],
				});
			} finally {
				setLoading(false);
			}
		};

		fetchFiles();
	}, [subject.name, courseId, semester]);

	// Helpers to extract meta from a filename-like string
	const extractYear = (name) => {
		if (!name) return null;
		const m = String(name).match(/\b(19|20)\d{2}\b/);
		return m ? parseInt(m[0], 10) : null;
	};

	const textIncludes = (hay, needle) => {
		if (!needle) return false;
		return String(hay || "")
			.toLowerCase()
			.includes(String(needle).toLowerCase());
	};

	const getName = (item) => {
		if (typeof item === "string") return item;
		return (
			item?.displayName ||
			item?.fileName ||
			item?.originalName ||
			item?.title ||
			""
		);
	};

	// Helper to get professor/year for display
	const getMeta = (item) => {
		if (typeof item !== "object" || !item) return { professor: "", year: "" };
		return {
			professor: item.professor || "",
			year: item.year || "",
		};
	};

	// Compute a sorted list based on professor/year hints (only when provided)
	const getSorted = (arr) => {
		const profQ = (professorQuery || "").trim();
		const yearQ = (yearQuery || "").toString().trim();
		if (!profQ && !yearQ) return arr;
		return [...arr].sort((a, b) => {
			const an = getName(a);
			const bn = getName(b);
			const ameta = getMeta(a);
			const bmeta = getMeta(b);

			// Prefer explicit professor/year fields if present
			const aProfMatch = profQ
				? textIncludes(ameta.professor, profQ) || textIncludes(an, profQ)
				: false;
			const bProfMatch = profQ
				? textIncludes(bmeta.professor, profQ) || textIncludes(bn, profQ)
				: false;
			const aYearMatch = yearQ
				? textIncludes(ameta.year, yearQ) || textIncludes(an, yearQ)
				: false;
			const bYearMatch = yearQ
				? textIncludes(bmeta.year, yearQ) || textIncludes(bn, yearQ)
				: false;

			// Tiers (higher first) based on provided queries only
			let aTier = 0;
			let bTier = 0;
			if (profQ && yearQ) {
				aTier = aProfMatch && aYearMatch ? 2 : aProfMatch || aYearMatch ? 1 : 0;
				bTier = bProfMatch && bYearMatch ? 2 : bProfMatch || bYearMatch ? 1 : 0;
			} else if (profQ) {
				aTier = aProfMatch ? 1 : 0;
				bTier = bProfMatch ? 1 : 0;
			} else if (yearQ) {
				aTier = aYearMatch ? 1 : 0;
				bTier = bYearMatch ? 1 : 0;
			}

			if (aTier !== bTier) return bTier - aTier; // higher tier first

			// When year query is present, within same tier prefer newer year
			const ay = ameta.year ? parseInt(ameta.year, 10) : extractYear(an);
			const by = bmeta.year ? parseInt(bmeta.year, 10) : extractYear(bn);
			if (yearQ && ay != null && by != null && ay !== by) return by - ay;

			// Fallback: alphabetical by name
			return an.localeCompare(bn);
		});
	};

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

			{/* Optional sort/filter inputs */}
			<div className="mb-4 flex flex-col md:flex-row gap-2">
				<input
					type="text"
					value={professorQuery}
					onChange={(e) => setProfessorQuery(e.target.value)}
					placeholder="Professor/Teacher name (optional)"
					className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					type="text"
					value={yearQuery}
					onChange={(e) => setYearQuery(e.target.value.replace(/[^0-9]/g, ""))}
					placeholder="Year e.g. 2024 (optional)"
					className="w-full md:w-48 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
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
				<button
					onClick={() => setActiveTab("current-semester-2025")}
					className={`py-3 px-4 font-medium text-sm transition-all duration-300 ${
						activeTab === "current-semester-2025"
							? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
							: "text-gray-600 hover:text-blue-600 hover:bg-blue-25"
					}`}
				>
					<span className="flex items-center gap-2">
						📅 Current Semester
						{loading ? (
							<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs animate-pulse">
								...
							</span>
						) : (
							<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
								{files["current-semester-2025"].length}
							</span>
						)}
					</span>
				</button>
				{(files.assignments.length > 0 || !loading) && (
					<button
						onClick={() => setActiveTab("assignments")}
						className={`py-3 px-4 font-medium text-sm transition-all duration-300 ${
							activeTab === "assignments"
								? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
								: "text-gray-600 hover:text-blue-600 hover:bg-blue-25"
						}`}
					>
						<span className="flex items-center gap-2">
							📋 Assignments
							{loading ? (
								<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs animate-pulse">
									...
								</span>
							) : (
								<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
									{files.assignments.length}
								</span>
							)}
						</span>
					</button>
				)}
				{(files.others.length > 0 || !loading) && (
					<button
						onClick={() => setActiveTab("others")}
						className={`py-3 px-4 font-medium text-sm transition-all duration-300 ${
							activeTab === "others"
								? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
								: "text-gray-600 hover:text-blue-600 hover:bg-blue-25"
						}`}
					>
						<span className="flex items-center gap-2">
							📁 Others
							{loading ? (
								<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs animate-pulse">
									...
								</span>
							) : (
								<span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
									{files.others.length}
								</span>
							)}
						</span>
					</button>
				)}
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

			<FileList
				files={getSorted(files[activeTab])}
				renderMeta={(item) => {
					const meta = getMeta(item);
					return meta.professor || meta.year ? (
						<span className="text-xs text-gray-500 ml-2">
							{meta.professor && <span>Prof: {meta.professor}</span>}
							{meta.professor && meta.year && <span> • </span>}
							{meta.year && <span>Year: {meta.year}</span>}
						</span>
					) : null;
				}}
			/>
		</div>
	);
};

export default SubjectCard;
