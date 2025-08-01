import React, { useState } from "react";
import CollegeSelector from "./CollegeSelector.jsx";
import CourseSelector from "./CourseSelector.jsx";
import UploadTypeSelector from "./UploadTypeSelector.jsx";
import SubcourseSelector from "./SubcourseSelector.jsx";
import SemesterSelector from "./SemesterSelector.jsx";
import SubjectSelector from "./SubjectSelector.jsx";
import EnhancedUploadForm from "./EnhancedUploadForm.jsx";
import { colleges } from "../../data/colleges";
import { uploadTypes } from "../../data/uploadTypes";
import bhuCourseStructure from "../../data/bhuCourseStructure.json";
import nitkCourseStructure from "../../data/nitkCourseStructure.json";

const UploadWrapper = () => {
	const [selectedCollege, setSelectedCollege] = useState("");
	const [selectedCourse, setSelectedCourse] = useState("");
	const [selectedSubcourse, setSelectedSubcourse] = useState(""); // For BHU specializations
	const [selectedType, setSelectedType] = useState("");
	const [selectedSemester, setSelectedSemester] = useState("");
	const [selectedSubject, setSelectedSubject] = useState("");
	const [uploadSuccess, setUploadSuccess] = useState(false);

	// Get available courses for selected college from course structure
	const getAvailableCourses = () => {
		if (!selectedCollege) return [];

		let courseStructure;
		if (selectedCollege === "bhu") {
			courseStructure = bhuCourseStructure.bhu;
		} else if (selectedCollege === "nitk") {
			courseStructure = nitkCourseStructure.nitk;
		} else {
			return [];
		}

		return Object.keys(courseStructure || {}).map((courseId) => ({
			id: courseId,
			name: courseStructure[courseId].courseName,
			...courseStructure[courseId],
		}));
	};

	const availableCourses = getAvailableCourses();

	// Get selected course object
	const courseObj = availableCourses.find(
		(course) => course.id === selectedCourse
	);

	// Get available subcourses for BHU (like botany, chemistry for BSc)
	const getAvailableSubcourses = () => {
		if (selectedCollege !== "bhu" || !selectedCourse) return [];

		const degreeData = bhuCourseStructure.bhu[selectedCourse];
		if (degreeData && degreeData.course) {
			return Object.keys(degreeData.course).map((subcourseId) => ({
				id: subcourseId,
				name: degreeData.course[subcourseId].name,
				...degreeData.course[subcourseId],
			}));
		}
		return [];
	};

	const availableSubcourses = getAvailableSubcourses();

	// Get available semesters for selected course
	const getAvailableSemesters = () => {
		if (!selectedCollege || !selectedCourse) return [];

		let courseData;
		if (selectedCollege === "bhu") {
			const degreeData = bhuCourseStructure.bhu[selectedCourse];
			if (degreeData && degreeData.course && selectedSubcourse) {
				// For BHU, selectedSubcourse represents the subcourse (like botany, chemistry)
				const subcourseData = degreeData.course[selectedSubcourse];
				if (subcourseData && subcourseData.semesters) {
					return Object.keys(subcourseData.semesters).map((sem) => ({
						id: sem,
						name: `Semester ${sem}`,
						subjects: subcourseData.semesters[sem].subjects || [],
					}));
				}
			}
			return [];
		} else if (selectedCollege === "nitk") {
			courseData = nitkCourseStructure.nitk[selectedCourse];
			if (courseData && courseData.semesters) {
				return Object.keys(courseData.semesters).map((sem) => ({
					id: sem,
					name: `Semester ${sem}`,
					totalCredits: courseData.semesters[sem].totalCredits || 0,
				}));
			}
		}
		return [];
	};

	const availableSemesters = getAvailableSemesters();

	// Get available subjects for selected semester
	const getAvailableSubjects = () => {
		if (!selectedCollege || !selectedCourse || !selectedSemester) return [];

		if (selectedCollege === "bhu") {
			const degreeData = bhuCourseStructure.bhu[selectedCourse];
			if (degreeData && degreeData.course && selectedSubcourse) {
				const subcourseData = degreeData.course[selectedSubcourse];
				if (
					subcourseData &&
					subcourseData.semesters &&
					subcourseData.semesters[selectedSemester]
				) {
					return subcourseData.semesters[selectedSemester].subjects || [];
				}
			}
			return [];
		} else if (selectedCollege === "nitk") {
			const courseData = nitkCourseStructure.nitk[selectedCourse];
			if (
				courseData &&
				courseData.semesters &&
				courseData.semesters[selectedSemester]
			) {
				return courseData.semesters[selectedSemester].subjects || [];
			}
		}
		return [];
	};

	const availableSubjects = getAvailableSubjects();

	// Get selected upload type object
	const uploadTypeObj = uploadTypes.find((type) => type.id === selectedType);

	// Show subcourse selector for BHU when course has subcourses
	const showSubcourseSelector =
		selectedCollege === "bhu" &&
		selectedCourse &&
		availableSubcourses.length > 0;

	// Determine if semester selector should be shown
	const showSemesterSelector =
		courseObj &&
		uploadTypeObj &&
		uploadTypeObj.requiresSemester &&
		(selectedCollege === "nitk" ||
			(selectedCollege === "bhu" &&
				selectedSubcourse &&
				courseObj.id !== "phd"));

	// Determine if subject selector should be shown
	const showSubjectSelector =
		showSemesterSelector && selectedSemester && availableSubjects.length > 0;

	// Check if all required fields are selected
	const isFormComplete =
		selectedCollege &&
		selectedCourse &&
		selectedType &&
		(!showSubcourseSelector || selectedSubcourse) &&
		(!showSemesterSelector || selectedSemester) &&
		(!showSubjectSelector || selectedSubject);

	const handleCollegeChange = (collegeId) => {
		setSelectedCollege(collegeId);
		setSelectedCourse("");
		setSelectedSubcourse("");
		setSelectedType("");
		setSelectedSemester("");
		setSelectedSubject("");
		setUploadSuccess(false);
	};

	const handleCourseChange = (courseId) => {
		setSelectedCourse(courseId);
		setSelectedSubcourse("");
		setSelectedType("");
		setSelectedSemester("");
		setSelectedSubject("");
		setUploadSuccess(false);
	};

	const handleSubcourseChange = (subcourseId) => {
		setSelectedSubcourse(subcourseId);
		setSelectedType("");
		setSelectedSemester("");
		setSelectedSubject("");
		setUploadSuccess(false);
	};

	const handleTypeChange = (typeId) => {
		setSelectedType(typeId);
		setSelectedSemester("");
		setSelectedSubject("");
		setUploadSuccess(false);
	};

	const handleSemesterChange = (semester) => {
		setSelectedSemester(semester);
		setSelectedSubject("");
		setUploadSuccess(false);
	};

	const handleSubjectChange = (subjectCode) => {
		setSelectedSubject(subjectCode);
		setUploadSuccess(false);
	};

	const handleUpload = (uploadData) => {
		// Find subject object if code is available
		const subjectObj = selectedSubject
			? availableSubjects.find(
					(s) => s.code === selectedSubject || s.name === selectedSubject
			  )
			: null;

		// Create upload configuration
		const uploadConfig = {
			college: selectedCollege, // Use ID instead of name for consistent paths
			course: courseObj?.id || selectedCourse, // Use ID instead of name
			subcourse: selectedSubcourse || null, // Already an ID
			uploadType: uploadTypeObj?.id, // Use ID instead of name for folder structure
			semester: selectedSemester || null,
			subject: subjectObj
				? subjectObj.code || subjectObj.name
				: selectedSubject, // Use subject code or name, not the whole object
		};

		console.log("Upload Data:", { ...uploadData, config: uploadConfig });

		// Check if upload was successful (this is called after the actual upload in EnhancedUploadForm)
		if (uploadData.success) {
			// Show success message
			setUploadSuccess(true);

			// Hide success message after 5 seconds
			setTimeout(() => {
				setUploadSuccess(false);
			}, 5000);
		} else {
			// Handle upload failure
			console.error("Upload failed:", uploadData.error);
		}
	};

	return (
		<>
			<div className="mt-20 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-xl text-m">
				<p>
					<strong>Note:</strong> Once you upload your notes, they will be sent
					for review. After approval by the moderators, your materials will be
					visible on the platform for everyone to access. Thank you for
					contributing!
				</p>
			</div>

			<div className="min-h-screen bg-gray-50 py-8">
				<div className="w-full px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Upload Academic Materials
						</h1>
						<p className="text-lg text-gray-600">
							Share notes, PYQs, and books with your fellow students
						</p>
					</div>

					{/* Success Message */}
					{uploadSuccess && (
						<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
							<div className="flex items-center">
								<div className="text-green-400 mr-3">✅</div>
								<div>
									<h3 className="text-sm font-medium text-green-800">
										Upload Successful!
									</h3>
									<p className="text-sm text-green-700 mt-1">
										Your files have been uploaded successfully and will be
										reviewed before being made available.
									</p>
								</div>
							</div>
						</div>
					)}

					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						{/* Step Indicators */}
						<div className="mb-8">
							<div className="flex items-center justify-between flex-wrap gap-4">
								<div
									className={`flex items-center ${
										selectedCollege ? "text-blue-600" : "text-gray-400"
									}`}
								>
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
											selectedCollege ? "bg-blue-600 text-white" : "bg-gray-200"
										}`}
									>
										1
									</div>
									<span className="ml-2 text-sm font-medium">College</span>
								</div>
								<div
									className={`flex items-center ${
										selectedCourse ? "text-blue-600" : "text-gray-400"
									}`}
								>
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
											selectedCourse ? "bg-blue-600 text-white" : "bg-gray-200"
										}`}
									>
										2
									</div>
									<span className="ml-2 text-sm font-medium">Course</span>
								</div>
								{showSubcourseSelector && (
									<div
										className={`flex items-center ${
											selectedSubcourse ? "text-blue-600" : "text-gray-400"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
												selectedSubcourse
													? "bg-blue-600 text-white"
													: "bg-gray-200"
											}`}
										>
											3
										</div>
										<span className="ml-2 text-sm font-medium">
											Specialization
										</span>
									</div>
								)}
								<div
									className={`flex items-center ${
										selectedType ? "text-blue-600" : "text-gray-400"
									}`}
								>
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
											selectedType ? "bg-blue-600 text-white" : "bg-gray-200"
										}`}
									>
										{showSubcourseSelector ? 4 : 3}
									</div>
									<span className="ml-2 text-sm font-medium">Type</span>
								</div>
								{showSemesterSelector && (
									<div
										className={`flex items-center ${
											selectedSemester ? "text-blue-600" : "text-gray-400"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
												selectedSemester
													? "bg-blue-600 text-white"
													: "bg-gray-200"
											}`}
										>
											{showSubcourseSelector ? 5 : 4}
										</div>
										<span className="ml-2 text-sm font-medium">Semester</span>
									</div>
								)}
								{showSubjectSelector && (
									<div
										className={`flex items-center ${
											selectedSubject ? "text-blue-600" : "text-gray-400"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
												selectedSubject
													? "bg-blue-600 text-white"
													: "bg-gray-200"
											}`}
										>
											{showSubcourseSelector ? 6 : 5}
										</div>
										<span className="ml-2 text-sm font-medium">Subject</span>
									</div>
								)}
							</div>
						</div>

						{/* Form Sections */}
						<div className="space-y-6">
							<CollegeSelector
								selectedCollege={selectedCollege}
								onCollegeChange={handleCollegeChange}
								colleges={colleges}
							/>

							<CourseSelector
								selectedCourse={selectedCourse}
								onCourseChange={handleCourseChange}
								courses={availableCourses}
								college={selectedCollege}
							/>

							<SubcourseSelector
								selectedSubcourse={selectedSubcourse}
								onSubcourseChange={handleSubcourseChange}
								subcourses={availableSubcourses}
								show={showSubcourseSelector}
							/>

							{selectedCourse &&
								(!showSubcourseSelector || selectedSubcourse) && (
									<UploadTypeSelector
										selectedType={selectedType}
										onTypeChange={handleTypeChange}
										uploadTypes={uploadTypes}
									/>
								)}

							<SemesterSelector
								selectedSemester={selectedSemester}
								onSemesterChange={handleSemesterChange}
								maxSemesters={availableSemesters.length}
								show={showSemesterSelector}
							/>

							<SubjectSelector
								selectedSubject={selectedSubject}
								onSubjectChange={handleSubjectChange}
								subjects={availableSubjects}
								show={showSubjectSelector}
							/>

							{/* Upload Form */}
							{isFormComplete && (
								<div className="border-t pt-6">
									<EnhancedUploadForm
										onUpload={handleUpload}
										uploadConfig={{
											college: selectedCollege,
											course: courseObj?.id || selectedCourse,
											subcourse: selectedSubcourse,
											uploadType: uploadTypeObj?.id || selectedType,
											semester: selectedSemester,
											subject: selectedSubject,
											description: "", // Add default description
										}}
									/>
								</div>
							)}
						</div>
					</div>

					{/* Current Selection Summary */}
					{(selectedCollege ||
						selectedCourse ||
						selectedSubcourse ||
						selectedType ||
						selectedSemester ||
						selectedSubject) && (
						<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h3 className="text-sm font-medium text-blue-800 mb-2">
								Current Selection:
							</h3>
							<div className="text-sm text-blue-700 space-y-1">
								{selectedCollege && (
									<p>
										<span className="font-medium">College:</span>{" "}
										{colleges.find((c) => c.id === selectedCollege)?.name}
									</p>
								)}
								{selectedCourse && courseObj && (
									<p>
										<span className="font-medium">Course:</span>{" "}
										{courseObj.name}
									</p>
								)}
								{selectedSubcourse && (
									<p>
										<span className="font-medium">Specialization:</span>{" "}
										{availableSubcourses.find(
											(sc) => sc.id === selectedSubcourse
										)?.name || selectedSubcourse}
									</p>
								)}
								{selectedType && uploadTypeObj && (
									<p>
										<span className="font-medium">Type:</span>{" "}
										{uploadTypeObj.name}
									</p>
								)}
								{selectedSemester && (
									<p>
										<span className="font-medium">Semester:</span>{" "}
										{selectedSemester}
									</p>
								)}
								{selectedSubject && (
									<p>
										<span className="font-medium">Subject:</span>{" "}
										{availableSubjects.find(
											(s) => (s.code || s.name) === selectedSubject
										)?.name || selectedSubject}
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default UploadWrapper;
