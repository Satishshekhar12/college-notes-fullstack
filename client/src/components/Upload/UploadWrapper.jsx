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
import {
	getUploadFavorites,
	addUploadFavorite,
	removeUploadFavorite,
} from "../../utils/favoriteUploadStorage";

const UploadWrapper = () => {
	const [selectedCollege, setSelectedCollege] = useState("");
	const [selectedCourse, setSelectedCourse] = useState("");
	const [selectedSubcourse, setSelectedSubcourse] = useState(""); // For BHU specializations
	const [selectedType, setSelectedType] = useState("");
	const [selectedSemester, setSelectedSemester] = useState("");
	const [selectedSubject, setSelectedSubject] = useState("");
	const [uploadSuccess, setUploadSuccess] = useState(false);
	const [failedReasons, setFailedReasons] = useState([]);
	// New: upload favorites state
	const [favorites, setFavorites] = useState(() => getUploadFavorites());

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

		// Collect failure reasons if any
		const failures = Array.isArray(uploadData.failedUploads)
			? uploadData.failedUploads
					.filter((f) => !f.success)
					.map((f) => `${f.fileName || "Unknown file"}: ${f.error || "Failed"}`)
			: [];
		setFailedReasons(failures);

		// Consider success if at least one file uploaded successfully
		if (uploadData.successCount && uploadData.successCount > 0) {
			setUploadSuccess(true);
			setTimeout(() => setUploadSuccess(false), 5000);
		} else {
			console.error("Upload failed:", failures[0] || uploadData.error);
		}
	};

	// New: save current selection as favorite (up to semester/type/subject)
	const saveAsFavorite = () => {
		if (!selectedCollege || !selectedCourse) {
			alert("Please select at least College and Course");
			return;
		}
		const subjectDisplay = selectedSubject
			? availableSubjects.find((s) => (s.code || s.name) === selectedSubject)
					?.name || selectedSubject
			: null;
		const fav = {
			college: selectedCollege,
			courseId: selectedCourse,
			subcourseId: selectedSubcourse || null,
			semester: selectedSemester || null,
			typeId: selectedType || null,
			subject: selectedSubject || null,
			label: `${
				colleges.find((c) => c.id === selectedCollege)?.name || selectedCollege
			} • ${courseObj?.name || selectedCourse}${
				selectedSubcourse
					? ` • ${
							availableSubcourses.find((s) => s.id === selectedSubcourse)
								?.name || selectedSubcourse
					  }`
					: ""
			}${selectedType ? ` • ${uploadTypeObj?.name || selectedType}` : ""}${
				selectedSemester ? ` • Sem ${selectedSemester}` : ""
			}${subjectDisplay ? ` • ${subjectDisplay}` : ""}`,
		};
		const updated = addUploadFavorite(fav);
		setFavorites(updated);
	};

	// New: apply favorite selection (sets up to subject)
	const applyFavorite = (fav) => {
		setSelectedCollege(fav.college || "");
		setSelectedCourse(fav.courseId || "");
		setSelectedSubcourse(fav.subcourseId || "");
		setSelectedType(fav.typeId || "");
		setSelectedSemester(fav.semester || "");
		setSelectedSubject(fav.subject || "");
		setUploadSuccess(false);
		setFailedReasons([]);
	};

	const removeFavorite = (id) => {
		const updated = removeUploadFavorite(id);
		setFavorites(updated);
	};

	return (
		<>
			{/* Favorites header */}
			<div className="mt-20 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-xl text-m">
				<p>
					<strong>Note:</strong> Once you upload your notes, they will be sent
					for review. After approval by the moderators, your materials will be
					visible on the platform for everyone to access. Thank you for
					contributing!
				</p>
			</div>

			{/* New: Favorites Bar */}
			<div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-md font-semibold text-gray-800">⭐ Favorites</h3>
					<button
						onClick={saveAsFavorite}
						className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600"
					>
						Save current selection
					</button>
				</div>
				{favorites.length === 0 ? (
					<p className="text-sm text-gray-500">
						No favorites yet. Save a selection to reuse it quickly.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{favorites.map((f) => (
							<div
								key={f.id}
								className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm"
							>
								<button
									onClick={() => applyFavorite(f)}
									className="mr-2 hover:underline"
									title="Apply favorite"
								>
									{f.label ||
										`${f.college} • ${f.courseId}${
											f.subcourseId ? ` • ${f.subcourseId}` : ""
										}${f.typeId ? ` • ${f.typeId}` : ""}${
											f.semester ? ` • Sem ${f.semester}` : ""
										}${f.subject ? ` • ${f.subject}` : ""}`}
								</button>
								<button
									onClick={() => removeFavorite(f.id)}
									className="text-red-500 hover:text-red-600"
									title="Remove"
								>
									×
								</button>
							</div>
						))}
					</div>
				)}
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

					{/* Failure Reasons */}
					{failedReasons.length > 0 && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<h3 className="text-sm font-medium text-red-800 mb-2">
								Some files failed to upload
							</h3>
							<ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
								{failedReasons.map((msg, idx) => (
									<li key={idx}>{msg}</li>
								))}
							</ul>
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
