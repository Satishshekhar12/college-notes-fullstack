import React from "react";

const SemesterSelector = ({
	totalSemesters,
	selectedSemester,
	onSemesterSelect,
}) => {
	const semesters = Array.from({ length: totalSemesters }, (_, i) => i + 1);

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
			{semesters.map((sem) => (
				<button
					key={sem}
					onClick={() => onSemesterSelect(sem.toString())}
					className={`py-4 px-6 rounded-lg font-medium transition-all duration-300 ${
						selectedSemester === sem.toString()
							? "text-white shadow-lg transform scale-105"
							: "bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
					}`}
					style={
						selectedSemester === sem.toString()
							? { backgroundColor: "#155DFC" }
							: {}
					}
				>
					<div className="text-sm opacity-75 mb-1">Semester</div>
					<div className="text-xl font-bold">{sem}</div>
				</button>
			))}
		</div>
	);
};

export default SemesterSelector;
