import React from "react";

const SubcourseSelector = ({
	selectedSubcourse,
	onSubcourseChange,
	subcourses,
	show,
}) => {
	if (!show || !subcourses || subcourses.length === 0) return null;

	return (
		<div className="mb-6">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Select Specialization
			</label>
			<select
				value={selectedSubcourse}
				onChange={(e) => onSubcourseChange(e.target.value)}
				className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
			>
				<option value="">Choose a specialization...</option>
				{subcourses.map((subcourse) => (
					<option key={subcourse.id} value={subcourse.id}>
						{subcourse.name}
					</option>
				))}
			</select>
		</div>
	);
};

export default SubcourseSelector;
