import React from "react";

const CourseSelector = ({
	selectedCourse,
	onCourseChange,
	courses,
	college,
}) => {
	if (!college) return null;

	return (
		<div className="mb-6">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Select Course
			</label>
			<select
				value={selectedCourse}
				onChange={(e) => onCourseChange(e.target.value)}
				className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
			>
				<option value="">Choose a course...</option>
				{courses.map((course) => (
					<option key={course.id} value={course.id}>
						{course.name}
						{course.category && ` (${course.category})`}
					</option>
				))}
			</select>
		</div>
	);
};

export default CourseSelector;
