// LocalStorage utilities for Upload favorites (includes up to semester, type, subject)
const STORAGE_KEY = "uploadFavoritesV1";

export const getUploadFavorites = () => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error("Error reading upload favorites:", e);
		return [];
	}
};

const makeId = ({
	college,
	courseId,
	subcourseId,
	semester,
	typeId,
	subject,
}) =>
	[
		college || "",
		courseId || "",
		subcourseId || "",
		semester || "",
		typeId || "",
		subject || "",
	].join(":");

export const addUploadFavorite = (fav) => {
	try {
		const id = makeId(fav);
		const list = getUploadFavorites();
		if (list.some((f) => f.id === id)) return list;
		const item = { ...fav, id, addedAt: new Date().toISOString() };
		const updated = [item, ...list].slice(0, 50); // cap to 50
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		return updated;
	} catch (e) {
		console.error("Error adding upload favorite:", e);
		return getUploadFavorites();
	}
};

export const removeUploadFavorite = (id) => {
	try {
		const list = getUploadFavorites();
		const updated = list.filter((f) => f.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		return updated;
	} catch (e) {
		console.error("Error removing upload favorite:", e);
		return getUploadFavorites();
	}
};

export const clearUploadFavorites = () => {
	try {
		localStorage.removeItem(STORAGE_KEY);
		return [];
	} catch (e) {
		console.error("Error clearing upload favorites:", e);
		return [];
	}
};
