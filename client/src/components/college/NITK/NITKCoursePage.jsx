import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SemesterSelector from "./SemesterSelector.jsx";
import SubjectCard from "./SubjectCard.jsx";
import nitkCourseStructure from "../../../data/nitkCourseStructure.json";

const dummyBooks = [
	{
		title: "Introduction to Algorithms",
		author: "Thomas H. Cormen",
		link: "https://example.com/algorithms",
		icon: "📘",
	},
	{
		title: "Artificial Intelligence: A Modern Approach",
		author: "Stuart Russell",
		link: "https://example.com/ai",
		icon: "🤖",
	},
	{
		title: "Database System Concepts",
		author: "Abraham Silberschatz",
		link: "https://example.com/database",
		icon: "💾",
	},
];

const NITKCoursePage = () => {
	const { courseId } = useParams();
	const navigate = useNavigate();
	const [selectedSemester, setSelectedSemester] = useState(null);
	const [showBooks, setShowBooks] = useState(false);

	const nitk = nitkCourseStructure.nitk || {};
	const courseData =
		(nitk.PG && nitk.PG[courseId]) || (nitk.UG && nitk.UG[courseId]);

	if (!courseData) {
		return (
			<div className="min-h-screen bg-gray-50 pt-20 px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-2xl font-bold text-red-600">Course not found</h1>
					<button
						onClick={() => navigate("/")}
						className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
					>
						Back to Home
					</button>
				</div>
			</div>
		);
	}

	const handleSemesterSelect = (semester) => {
		setSelectedSemester(semester);
	};

	const renderSubjects = () => {
		if (!selectedSemester) return null;

		const subjects = courseData.semesters[selectedSemester]?.subjects || [];
		return (
			<div className="mt-8">
				<h3 className="text-2xl font-bold text-gray-800 mb-6">
					Semester {selectedSemester} Subjects
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{subjects.map((subject, index) => (
						<SubjectCard
							key={index}
							subject={subject}
							college="NITK"
							course={courseId}
							semester={selectedSemester}
						/>
					))}
				</div>
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-20 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<button
						onClick={() => navigate("/")}
						className="mb-4 flex items-center text-blue-600 hover:text-blue-800 font-medium"
					>
						<svg
							className="w-5 h-5 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back to Home
					</button>
					<h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
						{courseData.courseName}
					</h1>
					<div className="flex flex-wrap gap-4 text-sm text-gray-600">
						<span className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full shadow-sm">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							{courseData.totalSemesters} Semesters
						</span>
						<span className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full shadow-sm">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v8m4-4H8"
								/>
							</svg>
							{courseData.totalCredits} Credits
						</span>
						<span className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full shadow-sm">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 4v16m8-8H4"
								/>
							</svg>
							NITK
						</span>
					</div>
				</div>

				{/* Books Section */}
				<div className="mb-8 bg-white rounded-lg shadow-lg p-6">
					<button
						onClick={() => setShowBooks(!showBooks)}
						className="w-full flex items-center justify-between text-left"
					>
						<div className="flex items-center">
							<svg
								className="w-6 h-6 mr-3 text-blue-600"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
							</svg>
							<h2 className="text-2xl font-bold text-gray-800">
								📚 Books & Resources
							</h2>
						</div>
						<div className="bg-gray-100 rounded-full p-2">
							<svg
								className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
									showBooks ? "rotate-180" : ""
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					</button>

					{showBooks && (
						<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{dummyBooks.map((book, index) => (
								<div
									key={index}
									className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
								>
									<div className="flex items-start mb-3">
										<div className="text-3xl mr-3">{book.icon}</div>
										<div>
											<h3 className="font-bold text-gray-800 mb-1">
												{book.title}
											</h3>
											<p className="text-sm text-gray-600">by {book.author}</p>
										</div>
									</div>
									<a
										href={book.link}
										target="_blank"
										rel="noopener noreferrer"
										className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
									>
										<span>View Book</span>
										<svg
											className="ml-1 w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
											/>
										</svg>
									</a>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Semester Selection */}
				<div className="mb-8 bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-2xl font-bold text-gray-800 mb-6">
						Select Semester
					</h2>
					<SemesterSelector
						totalSemesters={courseData.totalSemesters}
						selectedSemester={selectedSemester}
						onSemesterSelect={handleSemesterSelect}
					/>
				</div>

				{/* Subjects */}
				{selectedSemester && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						{renderSubjects()}
					</div>
				)}
			</div>
		</div>
	);
};

export default NITKCoursePage;
