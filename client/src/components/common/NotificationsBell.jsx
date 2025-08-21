import React, { useEffect, useRef, useState } from "react";
import {
	fetchNotifications,
	getUnreadCount,
	markAllNotificationsRead,
	markNotificationRead,
} from "../../services/notificationService";

const NotificationsBell = () => {
	const [open, setOpen] = useState(false);
	const [unread, setUnread] = useState(0);
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const dropdownRef = useRef(null);

	const loadUnread = async () => {
		try {
			const count = await getUnreadCount();
			setUnread(count);
		} catch {
			// ignore errors
		}
	};

	const loadList = async () => {
		setLoading(true);
		try {
			const data = await fetchNotifications({ page: 1, limit: 10 });
			setItems(data.items || []);
			setUnread(data.unread || 0);
		} catch {
			// ignore errors
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUnread();
		const id = setInterval(loadUnread, 30000); // poll every 30s
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const onToggle = async () => {
		const next = !open;
		setOpen(next);
		if (next) await loadList();
	};

	const handleItemClick = async (item) => {
		try {
			if (!item.isRead) {
				await markNotificationRead(item._id);
				setUnread((u) => Math.max(0, u - 1));
			}
			if (item.link) {
				// simple client-side navigation
				window.location.href = item.link;
			}
		} catch {
			// ignore errors
		}
	};

	const handleMarkAll = async () => {
		try {
			await markAllNotificationsRead();
			setUnread(0);
			setItems((arr) => arr.map((i) => ({ ...i, isRead: true })));
		} catch {
			// ignore errors
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={onToggle}
				className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
				aria-label="Notifications"
				title="Notifications"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-6 w-6 text-gray-700 dark:text-gray-200"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>
				{unread > 0 && (
					<span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
						{unread > 9 ? "9+" : unread}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 z-50">
					<div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
						<span className="font-semibold text-gray-800 dark:text-gray-200">
							Notifications
						</span>
						<button
							onClick={handleMarkAll}
							className="text-xs text-blue-600 hover:underline"
						>
							Mark all as read
						</button>
					</div>
					<div className="max-h-96 overflow-auto">
						{loading ? (
							<div className="p-4 text-sm text-gray-500">Loading...</div>
						) : items.length === 0 ? (
							<div className="p-4 text-sm text-gray-500">No notifications</div>
						) : (
							<ul className="divide-y divide-gray-100 dark:divide-gray-800">
								{items.map((item) => (
									<li
										key={item._id}
										onClick={() => handleItemClick(item)}
										className={`px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
											item.isRead ? "opacity-70" : ""
										}`}
									>
										<div className="text-sm font-medium text-gray-800 dark:text-gray-200">
											{item.title || "Notification"}
										</div>
										<div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
											{item.message}
										</div>
										<div className="text-[10px] text-gray-500 mt-1">
											{new Date(item.createdAt).toLocaleString()}
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default NotificationsBell;
