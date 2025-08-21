import { API_BASE_URL } from "../config/api";

const getAuthHeaders = () => {
	const token = localStorage.getItem("userToken");
	return token
		? {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
		  }
		: { "Content-Type": "application/json" };
};

export const fetchNotifications = async ({
	page = 1,
	limit = 10,
	onlyUnread = false,
} = {}) => {
	const params = new URLSearchParams({ page, limit, onlyUnread });
	const res = await fetch(`${API_BASE_URL}/api/notifications?${params}`, {
		headers: getAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to fetch notifications");
	return data.data;
};

export const getUnreadCount = async () => {
	const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
		headers: getAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to fetch unread count");
	return data.data.unread || 0;
};

export const markNotificationRead = async (id) => {
	const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
		method: "PATCH",
		headers: getAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to mark as read");
	return data.data;
};

export const markAllNotificationsRead = async () => {
	const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
		method: "PATCH",
		headers: getAuthHeaders(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to mark all as read");
	return true;
};
