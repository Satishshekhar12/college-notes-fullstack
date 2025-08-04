export const uploadTypes = [
	{
		id: "notes",
		name: "Semester Notes",
		description: "Lecture notes, study materials for specific semesters",
		requiresSemester: true,
		icon: "📝",
	},
	{
		id: "pyqs",
		name: "Previous Year Questions (PYQs)",
		description: "Past exam papers and question banks",
		requiresSemester: true,
		icon: "📋",
	},
	{
		id: "assignments",
		name: "Assignments",
		description: "Assignments, homework, lab exercises, and projects",
		requiresSemester: true,
		icon: "📊",
	},
	{
		id: "others",
		name: "Other Materials",
		description: "Other study materials and resources",
		requiresSemester: true,
		icon: "📄",
	},
	{
		id: "current-semester-2025",
		name: "Current Semester (2025)",
		description: "Materials specific to the current semester",
		requiresSemester: true,
		icon: "📅",
	},
	{
		id: "books",
		name: "General Book(soon)",
		description:
			"Reference books and study materials (outside semester system)",
		requiresSemester: false,
		icon: "📚",
	},
];
