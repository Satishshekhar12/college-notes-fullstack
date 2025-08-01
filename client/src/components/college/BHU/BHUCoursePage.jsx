import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseSelector from "./CourseSelector.jsx";
import SemesterSelector from "./SemesterSelector.jsx";
import SubjectCard from "./SubjectCard.jsx";
import BooksList from "./BooksList.jsx";
import bhuCourseStructure from "../../../data/bhuCourseStructure.json";

const BHUCoursePage = () => {
	const { degreeType } = useParams(); // e.g., 'bsc'
	const navigate = useNavigate();
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [selectedSemester, setSelectedSemester] = useState(null);
	const [activeTab, setActiveTab] = useState("courses"); // "courses", "books", "semesters"

	// Get degree data from BHU structure
	const degreeData = bhuCourseStructure.bhu?.[degreeType];

	if (!degreeData) {
		return (
			<div className="min-h-screen bg-gray-50 pt-20 px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-2xl font-bold text-red-600">Degree not found</h1>
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

	const handleCourseSelect = (courseId) => {
		setSelectedCourse(courseId);
		setActiveTab("books"); // Switch to books tab after course selection
		setSelectedSemester(null); // Reset semester selection
	};

	const handleSemesterSelect = (semester) => {
		setSelectedSemester(semester);
	};

	const renderSubjects = () => {
		if (!selectedCourse || !selectedSemester) return null;

		const courseData = degreeData.course[selectedCourse];
		const subjects = courseData?.semesters?.[selectedSemester]?.subjects || [];

		return (
			<div className="mt-8">
				<h3 className="text-2xl font-bold text-gray-800 mb-6">
					Semester {selectedSemester} Subjects - {courseData.name}
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{subjects.map((subject, index) => (
						<SubjectCard
							key={index}
							subject={subject}
							courseId={selectedCourse}
							semester={selectedSemester}
						/>
					))}
				</div>
			</div>
		);
	};

	const renderContent = () => {
		if (!selectedCourse) {
			return (
				<CourseSelector
					courses={degreeData.course}
					onCourseSelect={handleCourseSelect}
				/>
			);
		}

		const courseData = degreeData.course[selectedCourse];
		const totalSemesters = Object.keys(courseData.semesters || {}).length;

		return (
			<div>
				{/* Course Header */}
				<div className="mb-6 p-6 bg-white rounded-lg shadow-lg">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
								{courseData.name}
							</h2>
							<p className="text-gray-600 mt-2">{courseData.description}</p>
						</div>
						<button
							onClick={() => {
								setSelectedCourse(null);
								setActiveTab("courses");
								setSelectedSemester(null);
							}}
							className="text-blue-600 hover:text-purple-600 font-medium"
						>
							← Back to Courses
						</button>
					</div>

					{/* Tabs */}
					<div className="flex space-x-4 border-b">
						<button
							onClick={() => setActiveTab("books")}
							className={`py-2 px-4 font-medium transition-colors ${
								activeTab === "books"
									? "text-blue-600 border-b-2 border-blue-600"
									: "text-gray-600 hover:text-blue-600"
							}`}
						>
							📚 Books & Resources
						</button>
						<button
							onClick={() => setActiveTab("semesters")}
							className={`py-2 px-4 font-medium transition-colors ${
								activeTab === "semesters"
									? "text-blue-600 border-b-2 border-blue-600"
									: "text-gray-600 hover:text-blue-600"
							}`}
						>
							📖 Semesters
						</button>
					</div>
				</div>

				{/* Tab Content */}
				{activeTab === "books" && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<BooksList courseId={selectedCourse} />
					</div>
				)}

				{activeTab === "semesters" && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h3 className="text-2xl font-bold text-gray-800 mb-6">
							Select Semester
						</h3>
						<SemesterSelector
							totalSemesters={totalSemesters}
							selectedSemester={selectedSemester}
							onSemesterSelect={handleSemesterSelect}
						/>
						{renderSubjects()}
					</div>
				)}
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
						className="mb-4 flex items-center text-blue-600 hover:text-purple-600 font-medium"
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
						{degreeData.courseName} - BHU
					</h1>
					<p className="text-lg text-gray-600 mb-6">{degreeData.description}</p>
				</div>

				{/* Main Content */}
				{renderContent()}
			</div>
		</div>
	);
};

export default BHUCoursePage;
