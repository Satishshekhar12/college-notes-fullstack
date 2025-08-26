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

// ===== Friend Groups API =====
export const listFriendGroups = async () => {
	const res = await fetch(`${API_BASE_URL}/api/friends/groups`, {
		method: "GET",
		headers: getUserAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to list groups");
	return data?.data?.groups || [];
};

export const createFriendGroup = async ({ name, description = "" }) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/groups`, {
		method: "POST",
		headers: getUserAuthHeaders(),
		body: JSON.stringify({ name, description }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to create group");
	return data?.data?.group;
};

export const updateFriendGroup = async (id, { name, description }) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/groups/${id}`, {
		method: "PATCH",
		headers: getUserAuthHeaders(),
		body: JSON.stringify({ name, description }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to update group");
	return data?.data?.group;
};

export const deleteFriendGroup = async (id) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/groups/${id}`, {
		method: "DELETE",
		headers: getUserAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to delete group");
	return true;
};

export const addMemberToGroup = async (id, username) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/groups/${id}/members`, {
		method: "POST",
		headers: getUserAuthHeaders(),
		body: JSON.stringify({ username }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to add member");
	return true;
};

export const removeMemberFromGroup = async (id, username) => {
	const res = await fetch(`${API_BASE_URL}/api/friends/groups/${id}/members`, {
		method: "DELETE",
		headers: getUserAuthHeaders(),
		body: JSON.stringify({ username }),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to remove member");
	return true;
};
