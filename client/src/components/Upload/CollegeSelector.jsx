import React from "react";

const CollegeSelector = ({ selectedCollege, onCollegeChange, colleges }) => {
	return (
		<div className="mb-6">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Select College
			</label>
			<select
				value={selectedCollege}
				onChange={(e) => onCollegeChange(e.target.value)}
				className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
			>
				<option value="">Choose a college...</option>
				{colleges.map((college) => (
					<option key={college.id} value={college.id}>
						{college.name}
					</option>
				))}
			</select>
		</div>
	);
};

export default CollegeSelector;
