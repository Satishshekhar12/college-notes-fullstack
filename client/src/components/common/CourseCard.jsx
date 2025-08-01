import React from "react";

const CourseCard = ({ courseId, course, onCourseClick }) => {
	return (
		<div
			className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 cursor-pointer border border-gray-200"
			onClick={() => onCourseClick(courseId)}
		>
			<div className="mb-4">
				<h3 className="text-xl font-semibold text-gray-800 mb-2">
					{course.courseName}
				</h3>
				{course.description && (
					<p className="text-gray-600 text-sm mb-3">{course.description}</p>
				)}
			</div>

			<div className="flex flex-wrap gap-2 text-sm text-gray-500">
				{course.totalSemesters && (
					<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
						{course.totalSemesters} Semesters
					</span>
				)}
				{course.totalCredits && (
					<span className="bg-green-100 text-green-800 px-2 py-1 rounded">
						{course.totalCredits} Credits
					</span>
				)}
				{course.course && (
					<span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
						{Object.keys(course.course).length} course
					</span>
				)}
			</div>

			<div className="mt-4 flex items-center justify-between">
				<span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
					{/* {courseId.toUpperCase()} */}
				</span>
				<svg
					className="w-5 h-5 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</div>
		</div>
	);
};

export default CourseCard;
