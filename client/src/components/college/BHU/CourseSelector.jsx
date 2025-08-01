import React from "react";

const CourseSelector = ({ courses, onCourseSelect }) => {
	const courseEntries = Object.entries(courses || {});

	return (
		<div className="bg-white rounded-lg shadow-lg p-6">
			<h2 className="text-2xl font-bold text-gray-800 mb-6">Select a Course</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{courseEntries.map(([courseId, courseData]) => (
					<div
						key={courseId}
						onClick={() => onCourseSelect(courseId)}
						className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
					>
						<div className="mb-4">
							<h3 className="text-xl font-semibold text-gray-800 mb-2">
								{courseData.name}
							</h3>
							<p className="text-gray-600 text-sm">{courseData.description}</p>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
								{courseId.toUpperCase()}
							</span>
							<div className="bg-blue-100 rounded-full p-2">
								<svg
									className="w-5 h-5 text-blue-600"
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

						{/* Course metadata */}
						<div className="mt-4 flex flex-wrap gap-2">
							{courseData.semesters && (
								<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
									{Object.keys(courseData.semesters).length} Semesters
								</span>
							)}
							<span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
								BHU
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default CourseSelector;
