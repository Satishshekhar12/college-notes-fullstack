import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/pages/HomePage.module.css";
import GetInTouch from "./GetInTouch.jsx";
import CourseCard from "../components/common/CourseCard.jsx";
import FavoriteCourses from "../components/common/FavoriteCourses.jsx";
import nitkCourseStructure from "../data/nitkCourseStructure.json";
import bhuCourseStructure from "../data/bhuCourseStructure.json";
import { API_BASE_URL } from "../config/api";

const HomePage = () => {
	const [selectedCollege, setSelectedCollege] = useState("nitk"); // Default to NITK
	const [showModal, setShowModal] = useState(false);
	const [stats, setStats] = useState({
		totalNotes: 0,
		pendingNotes: 0,
		totalCourses: 0,
	});
	const navigate = useNavigate();

	// Show modal on page load
	useEffect(() => {
		const hasSeenModal = localStorage.getItem("hasSeenUploadModal");
		if (!hasSeenModal) {
			setShowModal(true);
		}
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			// Fetch total notes and pending notes
			const response = await fetch(
				`${API_BASE_URL}/api/notes?status=all&limit=1000`
			);
			if (response.ok) {
				const data = await response.json();
				const allNotes = data.data?.notes || [];

				const totalNotes = allNotes.length;
				const pendingNotes = allNotes.filter(
					(note) => note.status === "pending"
				).length;

				// Calculate total courses from course structure
				let totalCourses = 0;
				if (nitkCourseStructure.nitk) {
					totalCourses += Object.keys(nitkCourseStructure.nitk).length;
				}
				if (bhuCourseStructure.bhu) {
					totalCourses += Object.keys(bhuCourseStructure.bhu).length;
				}

				setStats({
					totalNotes,
					pendingNotes,
					totalCourses,
				});
			}
		} catch (error) {
			console.error("Error fetching stats:", error);
		}
	};

	const closeModal = () => {
		setShowModal(false);
		localStorage.setItem("hasSeenUploadModal", "true");
	};

	const goToUpload = () => {
		setShowModal(false);
		localStorage.setItem("hasSeenUploadModal", "true");
		navigate("/upload");
	};

	const handleCollegeChange = (collegeId) => {
		setSelectedCollege(collegeId);
	};

	const handleCourseClick = (courseId) => {
		// Navigate to course page based on college
		if (selectedCollege === "nitk") {
			navigate(`/nitk/${courseId}`);
		} else if (selectedCollege === "bhu") {
			// For BHU, courseId represents degree type (bsc, bcom, ba)
			navigate(`/bhu/${courseId}`);
		}
	};

	const renderCourseCards = () => {
		if (!selectedCollege) {
			return null;
		}

		let courses;
		if (selectedCollege === "bhu") {
			if (!bhuCourseStructure.bhu) {
				return null;
			}
			// For BHU, show degree types (bsc, bcom, ba)
			courses = Object.keys(bhuCourseStructure.bhu);
		} else if (selectedCollege === "nitk") {
			if (!nitkCourseStructure[selectedCollege]) {
				return null;
			}
			courses = Object.keys(nitkCourseStructure[selectedCollege]);
		} else {
			return null;
		}

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
				{courses.map((courseId) => {
					const course =
						selectedCollege === "bhu"
							? bhuCourseStructure.bhu[courseId]
							: nitkCourseStructure[selectedCollege][courseId];
					return (
						<CourseCard
							key={courseId}
							courseId={courseId}
							course={course}
							college={selectedCollege}
							onCourseClick={handleCourseClick}
						/>
					);
				})}
			</div>
		);
	};

	return (
		<div className={styles.container}>
			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md mx-4">
						<h2 className="text-xl font-bold text-gray-800 mb-4">
							Help us grow! 📚
						</h2>
						<p className="text-gray-600 mb-6">
							Contribute by uploading quality study materials in the{" "}
							<strong>Upload</strong> section. Your notes could help many
							students!
						</p>
						<div className="flex gap-3">
							<button
								onClick={goToUpload}
								className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition duration-200"
							>
								Go to Upload
							</button>
							<button
								onClick={closeModal}
								className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Hero Section */}
			<section
				className={`${styles.hero} bg-gradient-to-r from-[#66bfbf] via-[#40e0d0] to-[#11999e]  animate-gradient`}
			>
				<div className={styles.heroContent}>
					<h1 className={styles.title}>College Notes</h1>
					<p className={styles.subtitle}>Your Academic Resource Hub</p>
					{/* buttons BHU/NITK */}
					<div className={styles.collegeTabs}>
						{/* <div
							className={`${styles.college} ${
								selectedCollege === "bhu" ? styles.active : ""
							}`}
							onClick={() => handleCollegeChange("bhu")}
						>
							BHU
						</div> */}
						<div
							className={`${styles.college} ${
								selectedCollege === "nitk" ? styles.active : ""
							}`}
							onClick={() => handleCollegeChange("nitk")}
						>
							NITK
						</div>
					</div>
				</div>
			</section>

			{/* Courses Section - Dynamic based on selected college */}
			<section className={styles.coursesSection}>
				<div className={styles.sectionContent}>
					{/* Favorite Courses Section */}
					<FavoriteCourses />

					{/* Stats Cards */}
					<div className="mt-8 mb-8">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-blue-50 p-6 rounded-lg shadow-md">
								<h3 className="text-sm font-medium text-blue-800 mb-2">
									Total Notes
								</h3>
								<p className="text-3xl font-bold text-blue-900">
									{stats.totalNotes}
								</p>
								<p className="text-xs text-blue-600 mt-1">
									Available for download
								</p>
							</div>
							<div className="bg-yellow-50 p-6 rounded-lg shadow-md">
								<h3 className="text-sm font-medium text-yellow-800 mb-2">
									Pending Notes
								</h3>
								<p className="text-3xl font-bold text-yellow-900">
									{stats.pendingNotes}
								</p>
								<p className="text-xs text-yellow-600 mt-1">Under review</p>
							</div>
							<div className="bg-green-50 p-6 rounded-lg shadow-md">
								<h3 className="text-sm font-medium text-green-800 mb-2">
									Total Courses
								</h3>
								<p className="text-3xl font-bold text-green-900">
									{stats.totalCourses}
								</p>
								<p className="text-xs text-green-600 mt-1">
									Available programs
								</p>
							</div>
						</div>
					</div>
					<div className="bg-gradient-to-r from-[#f0fdfa] to-[#e0f7ff] border border-[#ccf] shadow-md rounded-2xl p-4 mb-6 text-center">
						<h2 className="text-lg font-semibold text-gray-800 mb-2">
							📢 Share Your Knowledge!
						</h2>
						<p className="text-sm text-gray-600">
							Help fellow students by uploading quality notes from your course.
							Go to the{" "}
							<button
								onClick={goToUpload}
								className="font-medium text-blue-600 underline hover:text-blue-800 focus:outline-none"
								type="button"
							>
								Upload
							</button>{" "}
							section and make a difference today!
						</p>
					</div>

					<div className="mt-32">
						<h2 className={styles.sectionTitle}>
							{selectedCollege === "bhu" ? "BHU" : "NITK"} Courses
						</h2>
					</div>

					{renderCourseCards()}
				</div>
			</section>

			{/* Books Section */}
			<section className={styles.booksSection}>
				<div className={styles.sectionContent}>
					<h2 className={styles.sectionTitle}>Books & Resources</h2>
					<div className={styles.booksCard}>
						<p className={styles.booksDescription}>
							Access a comprehensive collection of academic books, reference
							materials, and study resources for all courses.
						</p>
						<button
							className={styles.booksBtn}
							onClick={() => navigate("/books")}
						>
							Explore Books
							<span className={styles.arrow}>→</span>
						</button>
					</div>
				</div>
			</section>
			<GetInTouch />
		</div>
	);
};

export default HomePage;
