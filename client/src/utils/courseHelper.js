import nitkCourseStructure from "../data/nitkCourseStructure.json";
import bhuCourseStructure from "../data/bhuCourseStructure.json";
import { colleges } from "../data/colleges.js";

// Get all available courses from JSON files
export const getAllCourses = () => {
	const courses = [];

	// NITK courses
	if (nitkCourseStructure.nitk) {
		Object.keys(nitkCourseStructure.nitk).forEach((courseKey) => {
			const course = nitkCourseStructure.nitk[courseKey];
			courses.push({
				key: courseKey,
				name: course.courseName,
				college: "NITK",
				maxSemesters: course.totalSemesters || 8,
			});
		});
	}

	// BHU courses
	if (bhuCourseStructure.bhu) {
		Object.keys(bhuCourseStructure.bhu).forEach((courseKey) => {
			const course = bhuCourseStructure.bhu[courseKey];
			courses.push({
				key: courseKey,
				name: course.courseName,
				college: "BHU",
				maxSemesters: 6, // Default for BHU courses
			});
		});
	}

	return courses;
};

// Get courses for a specific college
export const getCoursesByCollege = (collegeId) => {
	const allCourses = getAllCourses();
	const college = colleges.find((c) => c.id === collegeId);

	if (!college) return [];

	return allCourses.filter((course) => course.college === college.shortName);
};

// Get maximum semesters for a course
export const getMaxSemesters = (courseKey, collegeId) => {
	if (collegeId === "nitk" && nitkCourseStructure.nitk[courseKey]) {
		return nitkCourseStructure.nitk[courseKey].totalSemesters || 8;
	}

	if (collegeId === "bhu" && bhuCourseStructure.bhu[courseKey]) {
		return 6; // BHU default
	}

	return 8; // Default fallback
};

// Generate semester options
export const generateSemesterOptions = (maxSemesters) => {
	const options = [];
	for (let i = 1; i <= maxSemesters; i++) {
		options.push({ value: i, label: `Semester ${i}` });
	}
	return options;
};
