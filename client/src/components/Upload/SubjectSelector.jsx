import React from "react";

const SubjectSelector = ({
	selectedSubject,
	onSubjectChange,
	subjects,
	show,
}) => {
	if (!show || !subjects || subjects.length === 0) return null;

	return (
		<div className="mb-6">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Select Subject
			</label>
			<select
				value={selectedSubject}
				onChange={(e) => onSubjectChange(e.target.value)}
				className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
			>
				<option value="">Choose a subject...</option>
				{subjects.map((subject) => (
					<option
						key={subject.code || subject.name}
						value={subject.code || subject.name}
					>
						{subject.code ? `${subject.code} - ${subject.name}` : subject.name}
						{subject.credits && ` (${subject.credits} credits)`}
					</option>
				))}
			</select>
		</div>
	);
};

export default SubjectSelector;
