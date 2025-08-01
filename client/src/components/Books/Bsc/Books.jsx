import React, { useState } from "react";
import SubjectBooks from "./SubjectBooks.jsx";

const Books = () => {
	const [expandedSubject, setExpandedSubject] = useState(null);

	// BSc subjects sorted A-Z
	const bscSubjects = [
		"Botany",
		"Chemistry",
		"ComputerScience",
		"Geography",
		"Geology",
		"HomeScienceAncillary",
		"IndustrialMicrobiology",
		"Maths",
		"Physics",
		"Psychology",
		"Statistics",
		"Zoology",
	].sort();

	const toggleSubject = (subject) => {
		setExpandedSubject(expandedSubject === subject ? null : subject);
	};

	return (
		<div className="mt-20 px-5 max-w-6xl mx-auto">
			<h1 className="text-4xl text-center mb-2 font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
				BSc Books Collection
			</h1>
			<p className="text-center text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
				Click on any subject to explore available books and resources.
			</p>

			<div className="flex flex-col gap-4">
				{bscSubjects.map((subject) => (
					<div
						key={subject}
						className="border border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm shadow-teal-200 transition-all duration-300 hover:shadow-md hover:shadow-teal-300 hover:-translate-y-0.5 overflow-hidden"
					>
						<div
							className={`cursor-pointer p-6 transition-all duration-300 border-b border-transparent relative ${
								expandedSubject === subject
									? "bg-gradient-to-r from-teal-500 to-teal-400 border-b-teal-400"
									: "bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100"
							}`}
							onClick={() => toggleSubject(subject)}
						>
							<h3
								className={`m-0 text-xl font-semibold flex items-center justify-between transition-colors duration-300 ${
									expandedSubject === subject ? "text-white" : "text-teal-500"
								}`}
							>
								{subject}
								<span
									className={`text-2xl font-bold min-w-6 text-center transition-all duration-300 ${
										expandedSubject === subject ? "text-white" : "text-teal-500"
									}`}
								>
									{expandedSubject === subject ? "−" : "+"}
								</span>
							</h3>
						</div>

						{expandedSubject === subject && (
							<div className="p-6 bg-white">
								<SubjectBooks subject={subject.toLowerCase()} />
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default Books;
