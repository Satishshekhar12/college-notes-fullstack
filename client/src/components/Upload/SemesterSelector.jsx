import React from "react";

const SemesterSelector = ({
	selectedSemester,
	onSemesterChange,
	maxSemesters,
	show,
}) => {
	if (!show) return null;

	// Create semester array based on maxSemesters or available semesters
	const semesters = Array.from({ length: maxSemesters }, (_, i) => i + 1);

	return (
		<div className="mb-6">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Select Semester
			</label>
			<select
				value={selectedSemester}
				onChange={(e) => onSemesterChange(e.target.value)}
				className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
			>
				<option value="">Choose a semester...</option>
				{semesters.map((sem) => (
					<option key={sem} value={sem.toString()}>
						Semester {sem}
					</option>
				))}
			</select>
		</div>
	);
};

export default SemesterSelector;
