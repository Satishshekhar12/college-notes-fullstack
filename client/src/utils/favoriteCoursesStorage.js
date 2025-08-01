// Utility functions for managing favorite courses in localStorage

const STORAGE_KEY = "collegeFavoriteCourses";

// Get all favorite courses from localStorage
export const getFavoriteCourses = () => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		console.error("Error reading favorite courses:", error);
		return [];
	}
};

// Add a course to favorites
export const addFavoriteCourse = (courseData) => {
	try {
		const favorites = getFavoriteCourses();
		const exists = favorites.find(
			(fav) =>
				fav.college === courseData.college &&
				fav.courseId === courseData.courseId
		);

		if (!exists) {
			const updatedFavorites = [
				...favorites,
				{
					...courseData,
					addedAt: new Date().toISOString(),
				},
			];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFavorites));
			return updatedFavorites;
		}
		return favorites;
	} catch (error) {
		console.error("Error adding favorite course:", error);
		return getFavoriteCourses();
	}
};

// Remove a course from favorites
export const removeFavoriteCourse = (college, courseId) => {
	try {
		const favorites = getFavoriteCourses();
		const updatedFavorites = favorites.filter(
			(fav) => !(fav.college === college && fav.courseId === courseId)
		);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFavorites));
		return updatedFavorites;
	} catch (error) {
		console.error("Error removing favorite course:", error);
		return getFavoriteCourses();
	}
};

// Check if a course is in favorites
export const isFavoriteCourse = (college, courseId) => {
	try {
		const favorites = getFavoriteCourses();
		return favorites.some(
			(fav) => fav.college === college && fav.courseId === courseId
		);
	} catch (error) {
		console.error("Error checking favorite course:", error);
		return false;
	}
};

// Initialize default favorite courses if none exist
export const initializeDefaultFavorites = () => {
	try {
		const favorites = getFavoriteCourses();
		if (favorites.length === 0) {
			// Add NITK MCA as default favorite
			const defaultFavorite = {
				college: "nitk",
				courseId: "mca",
				courseName: "Master of Computer Applications (MCA)",
				addedAt: new Date().toISOString(),
				isDefault: true,
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultFavorite]));
			return [defaultFavorite];
		}
		return favorites;
	} catch (error) {
		console.error("Error initializing default favorites:", error);
		return [];
	}
};

// Clear all favorite courses
export const clearFavoriteCourses = () => {
	try {
		localStorage.removeItem(STORAGE_KEY);
		return [];
	} catch (error) {
		console.error("Error clearing favorite courses:", error);
		return [];
	}
};
