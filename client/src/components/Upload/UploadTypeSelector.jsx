import React from "react";

const UploadTypeSelector = ({ selectedType, onTypeChange, uploadTypes }) => {
	return (
		<div className="mb-6">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Select Upload Type
			</label>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{uploadTypes.map((type) => (
					<div
						key={type.id}
						onClick={() => onTypeChange(type.id)}
						className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
							selectedType === type.id
								? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
								: "border-gray-200 hover:border-gray-300"
						}`}
					>
						<div className="text-center">
							<div className="text-2xl mb-2">{type.icon}</div>
							<h3 className="font-medium text-gray-900 mb-1">{type.name}</h3>
							<p className="text-sm text-gray-600">{type.description}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default UploadTypeSelector;
