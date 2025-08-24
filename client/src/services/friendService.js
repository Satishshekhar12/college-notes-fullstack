import { API_BASE_URL } from "../config/api";
import { getUserAuthHeaders } from "./userService";

export const addFriend = async (username) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/add`, {
		method: "POST",
		headers: getUserAuthHeaders(),
		body: JSON.stringify({ username }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to add friend");
	return data;
};

export const removeFriend = async (username) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/remove`, {
		method: "DELETE",
		headers: getUserAuthHeaders(),
		body: JSON.stringify({ username }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to remove friend");
	return data;
};

export const listFriends = async () => {
	const res = await fetch(`${API_BASE_URL}/api/friends/list`, {
		method: "GET",
		headers: getUserAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to list friends");
	return data?.data?.friends || [];
};

export const searchUsers = async (query) => {
	const res = await fetch(
		`${API_BASE_URL}/api/friends/search?query=${encodeURIComponent(query)}`,
		{
			method: "GET",
			headers: getUserAuthHeaders(),
		}
	);
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to search users");
	return data?.data?.users || [];
};
