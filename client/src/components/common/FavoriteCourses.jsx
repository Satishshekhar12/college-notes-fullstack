import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	removeFavoriteCourse,
	addFavoriteCourse,
	isFavoriteCourse,
	initializeDefaultFavorites,
} from "../../utils/favoriteCoursesStorage";
import nitkCourseStructure from "../../data/nitkCourseStructure.json";
import bhuCourseStructure from "../../data/bhuCourseStructure.json";

const FavoriteCourses = () => {
	const [favorites, setFavorites] = useState([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedCollege, setSelectedCollege] = useState("nitk");
	const navigate = useNavigate();

	useEffect(() => {
		loadFavorites();
	}, []);

	const loadFavorites = () => {
		const favs = initializeDefaultFavorites();
		setFavorites(favs);
	};

	const handleRemoveFavorite = (college, courseId) => {
		removeFavoriteCourse(college, courseId);
		loadFavorites();
	};

	const handleCourseClick = (favorite) => {
		if (favorite.college === "nitk") {
			navigate(`/nitk/${favorite.courseId}`);
		} else if (favorite.college === "bhu") {
			navigate(`/bhu/${favorite.courseId}`);
		}
	};

	const getAvailableCourses = () => {
		if (selectedCollege === "bhu") {
			return Object.keys(bhuCourseStructure.bhu || {}).map((courseId) => ({
				id: courseId,
				name: bhuCourseStructure.bhu[courseId]?.courseName || courseId,
				college: "bhu",
			}));
		} else if (selectedCollege === "nitk") {
			return Object.keys(nitkCourseStructure.nitk || {}).map((courseId) => ({
				id: courseId,
				name: nitkCourseStructure.nitk[courseId]?.courseName || courseId,
				college: "nitk",
			}));
		}
		return [];
	};

	const handleAddFavorite = (course) => {
		const courseData = {
			college: course.college,
			courseId: course.id,
			courseName: course.name,
		};
		addFavoriteCourse(courseData);
		loadFavorites();
		setShowAddModal(false);
	};

	return (
		<div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl shadow-lg p-6 mb-8 border border-teal-100">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-gray-800 flex items-center">
					<span className="text-yellow-500 mr-2">⭐</span>
					My Favorite Courses
				</h2>
				<button
					onClick={() => setShowAddModal(true)}
					className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
				>
					<span className="mr-2">+</span>
					Add Course
				</button>
			</div>

			{favorites.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-teal-300 text-6xl mb-4">📚</div>
					<p className="text-gray-600 mb-6 text-lg">
						No favorite courses added yet
					</p>
					<p className="text-gray-500 mb-6">
						Save your frequently accessed courses for quick navigation
					</p>
					<button
						onClick={() => setShowAddModal(true)}
						className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
					>
						Add Your First Course
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{favorites.map((favorite, index) => (
						<div
							key={index}
							className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-teal-300"
							onClick={() => handleCourseClick(favorite)}
						>
							<div className="flex items-center justify-between mb-3">
								<span
									className={`text-xs font-medium px-3 py-1 rounded-full uppercase ${
										favorite.college === "bhu"
											? "text-purple-700 bg-purple-100"
											: "text-teal-700 bg-teal-100"
									}`}
								>
									{favorite.college}
								</span>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleRemoveFavorite(favorite.college, favorite.courseId);
									}}
									className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 text-lg font-bold"
									title="Remove from favorites"
								>
									×
								</button>
							</div>
							<h3 className="font-semibold text-gray-800 mb-2 group-hover:text-teal-700 transition-colors duration-200 line-clamp-2">
								{favorite.courseName}
							</h3>
							<p className="text-sm text-gray-600 mb-3">
								Course ID:{" "}
								<span className="font-medium">{favorite.courseId}</span>
							</p>
							<div className="flex items-center text-teal-600 text-sm font-medium">
								<span>Click to open</span>
								<span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-200">
									→
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add Course Modal */}
			{showAddModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-xl font-bold text-gray-800">
								Add Favorite Course
							</h3>
							<button
								onClick={() => setShowAddModal(false)}
								className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
							>
								×
							</button>
						</div>

						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-3">
								Select College
							</label>
							<div className="flex space-x-2">
								<button
									onClick={() => setSelectedCollege("bhu")}
									className={`px-4 py-2 rounded-lg flex-1 transition-all duration-200 font-medium ${
										selectedCollege === "bhu"
											? "bg-purple-600 text-white shadow-md"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
								>
									BHU
								</button>
								<button
									onClick={() => setSelectedCollege("nitk")}
									className={`px-4 py-2 rounded-lg flex-1 transition-all duration-200 font-medium ${
										selectedCollege === "nitk"
											? "bg-teal-600 text-white shadow-md"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
								>
									NITK
								</button>
							</div>
						</div>

						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-3">
								Available Courses
							</label>
							<div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
								{getAvailableCourses().map((course) => {
									const isAlreadyFavorite = isFavoriteCourse(
										course.college,
										course.id
									);
									return (
										<button
											key={course.id}
											onClick={() =>
												!isAlreadyFavorite && handleAddFavorite(course)
											}
											disabled={isAlreadyFavorite}
											className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
												isAlreadyFavorite
													? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
													: "bg-white hover:bg-teal-50 border-gray-300 hover:border-teal-300 hover:shadow-sm"
											}`}
										>
											<div className="font-medium text-gray-800">
												{course.name}
											</div>
											<div className="text-sm text-gray-600">
												ID: {course.id}
											</div>
											{isAlreadyFavorite && (
												<div className="text-xs text-yellow-600 mt-1 flex items-center">
													<span className="mr-1">★</span>
													Already in favorites
												</div>
											)}
										</button>
									);
								})}
							</div>
						</div>

						<div className="flex space-x-3">
							<button
								onClick={() => setShowAddModal(false)}
								className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg transition-colors duration-200 font-medium"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default FavoriteCourses;
