import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import {
	getUserProfile,
	updateUserProfile,
	updateUserPassword,
	userLogout,
	setInitialPassword as setInitialPasswordApi,
	updateUsername as updateUsernameApi,
} from "../services/userService";
import {
	addFriend as addFriendApi,
	listFriends as listFriendsApi,
	removeFriend as removeFriendApi,
	listFriendGroups as listFriendGroupsApi,
	createFriendGroup as createFriendGroupApi,
	addMemberToGroup as addMemberToGroupApi,
	removeMemberFromGroup as removeMemberFromGroupApi,
} from "../services/friendService";
import { useNavigate } from "react-router-dom";
import ModeratorRequestForm from "../components/common/ModeratorRequestForm";
import { colleges } from "../data/colleges";
import { getAllCourses, getCoursesByCollege } from "../utils/courseHelper";
import PersonalDrive from "../components/Profile/PersonalDrive";

function Profile() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [userStats, setUserStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [activeTab, setActiveTab] = useState("profile");
	const [showModeratorRequestForm, setShowModeratorRequestForm] =
		useState(false);

	// Profile form state
	const [profileData, setProfileData] = useState({
		name: "",
		email: "",
		collegeName: "",
		course: "",
		semester: "",
		studentType: "",
		// Additional information fields
		phoneNumber: "",
		bio: "",
		linkedinProfile: "",
		githubProfile: "",
		interests: "",
		skills: "",
	});

	// College autocomplete state
	const [collegeSearch, setCollegeSearch] = useState("");
	const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
	const [filteredColleges, setFilteredColleges] = useState(colleges);

	// Course autocomplete state
	const [courseSearch, setCourseSearch] = useState("");
	const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
	const [availableCourses, setAvailableCourses] = useState([]);
	const [filteredCourses, setFilteredCourses] = useState([]);

	// Password form state
	const [passwordData, setPasswordData] = useState({
		passwordCurrent: "",
		password: "",
		passwordConfirm: "",
	});

	// Username & initial password
	const [username, setUsername] = useState("");
	const [initialPasswordData, setInitialPasswordData] = useState({
		password: "",
		passwordConfirm: "",
	});

	// No reauth state needed anymore

	// Friends state
	const [friends, setFriends] = useState([]);
	const [friendGroups, setFriendGroups] = useState([]);
	const [newGroupName, setNewGroupName] = useState("");
	const [groupMemberInputs, setGroupMemberInputs] = useState({}); // { [groupId]: username }
	const [friendUsername, setFriendUsername] = useState("");

	const fetchFriends = async () => {
		try {
			const list = await listFriendsApi();
			setFriends(list);
		} catch {
			// ignore
		}
	};

	const fetchFriendGroups = async () => {
		try {
			const groups = await listFriendGroupsApi();
			setFriendGroups(groups);
		} catch {
			// ignore
		}
	};

	useEffect(() => {
		console.log("🔄 Profile component mounting, fetching user data...");
		const fetchData = async () => {
			try {
				setLoading(true);
				const response = await getUserProfile();
				if (response.status === "success") {
					console.log("👤 User profile loaded:", response.data.user);
					setUser(response.data.user);
					setUsername(response.data.user.username || "");
					setProfileData({
						name: response.data.user.name || "",
						email: response.data.user.email || "",
						collegeName: response.data.user.collegeName || "",
						course: response.data.user.course || "",
						semester: response.data.user.semester || "",
						studentType: response.data.user.studentType || "",
						// Additional information
						phoneNumber: response.data.user.phoneNumber || "",
						bio: response.data.user.bio || "",
						linkedinProfile: response.data.user.linkedinProfile || "",
						githubProfile: response.data.user.githubProfile || "",
						interests: response.data.user.interests || "",
						skills: response.data.user.skills || "",
					});
					// Set college search to display name if college exists
					if (response.data.user.collegeName) {
						const college = colleges.find(
							(c) => c.id === response.data.user.collegeName
						);
						setCollegeSearch(
							college ? college.name : response.data.user.collegeName
						);

						// Load courses for the selected college
						if (college) {
							const courses = getCoursesByCollege(college.id);
							setAvailableCourses(courses);
							setFilteredCourses(courses);
						}
					}

					// Set course search to display name if course exists
					if (response.data.user.course) {
						setCourseSearch(response.data.user.course);
					}
					// Fetch user statistics
					await fetchUserStats();
					await fetchFriends();
					await fetchFriendGroups();
				}
			} catch (err) {
				setError(err.message || "Failed to fetch profile");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [navigate]);

	// Fetch friends on mount
	useEffect(() => {
		const fetchFriends = async () => {
			try {
				const list = await listFriendsApi();
				setFriends(list);
			} catch {
				// ignore
			}
		};

		fetchFriends();
		fetchFriendGroups();
	}, [navigate]);

	// Handle clicking outside college suggestions
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				!event.target.closest(".college-autocomplete") &&
				!event.target.closest(".course-autocomplete")
			) {
				setShowCollegeSuggestions(false);
				setShowCourseSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Handle college search
	const handleCollegeSearch = (value) => {
		setCollegeSearch(value);
		const filtered = colleges.filter(
			(college) =>
				college.name.toLowerCase().includes(value.toLowerCase()) ||
				college.shortName.toLowerCase().includes(value.toLowerCase())
		);
		setFilteredColleges(filtered);
		setShowCollegeSuggestions(value.length > 0);
	};

	// Handle college selection
	const handleCollegeSelect = (college) => {
		setCollegeSearch(college.name);
		setProfileData({
			...profileData,
			collegeName: college.id,
		});
		setShowCollegeSuggestions(false);

		// Load courses for selected college
		const courses = getCoursesByCollege(college.id);
		setAvailableCourses(courses);
		setFilteredCourses(courses);

		// Clear course selection if changing college
		setCourseSearch("");
		setProfileData((prev) => ({
			...prev,
			course: "",
		}));
	};

	// Handle custom college name (when user types something not in list)
	const handleCollegeBlur = () => {
		// If the typed value doesn't match any college, treat it as custom college name
		const matchedCollege = colleges.find(
			(c) => c.name.toLowerCase() === collegeSearch.toLowerCase()
		);
		if (!matchedCollege && collegeSearch.trim()) {
			setProfileData({
				...profileData,
				collegeName: collegeSearch.trim(),
			});
			// Load all courses for custom college
			const allCourses = getAllCourses();
			setAvailableCourses(allCourses);
			setFilteredCourses(allCourses);
		}
		setTimeout(() => setShowCollegeSuggestions(false), 150);
	};

	// Handle course search
	const handleCourseSearch = (value) => {
		setCourseSearch(value);
		const filtered = availableCourses.filter(
			(course) =>
				course.name.toLowerCase().includes(value.toLowerCase()) ||
				course.key.toLowerCase().includes(value.toLowerCase())
		);
		setFilteredCourses(filtered);
		setShowCourseSuggestions(value.length > 0);
	};

	// Handle course selection
	const handleCourseSelect = (course) => {
		setCourseSearch(course.name);
		setProfileData({
			...profileData,
			course: course.key,
		});
		setShowCourseSuggestions(false);
	};

	// Handle custom course name
	const handleCourseBlur = () => {
		const matchedCourse = availableCourses.find(
			(c) => c.name.toLowerCase() === courseSearch.toLowerCase()
		);
		if (!matchedCourse && courseSearch.trim()) {
			setProfileData({
				...profileData,
				course: courseSearch.trim(),
			});
		}
		setTimeout(() => setShowCourseSuggestions(false), 150);
	};

	const fetchUserStats = async () => {
		try {
			const token = localStorage.getItem("userToken");
			if (!token) return;

			console.log("🔄 Fetching user stats from /api/notes/user/my-notes");
			const response = await fetch(`${API_BASE_URL}/api/notes/user/my-notes`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				const userNotes = data.data.notes || [];
				console.log("📊 Fetched user notes:", userNotes.length, "notes");
				console.log(
					"📝 Note statuses:",
					userNotes.map((note) => note.status)
				);

				// Calculate user statistics
				const stats = {
					totalUploads: userNotes.length,
					approvedCount: userNotes.filter((note) => note.status === "approved")
						.length,
					rejectedCount: userNotes.filter((note) => note.status === "rejected")
						.length,
					pendingCount: userNotes.filter((note) => note.status === "pending")
						.length,
				};

				console.log("📈 Calculated stats:", stats);
				setUserStats(stats);
			} else {
				console.error(
					"❌ Failed to fetch user notes:",
					response.status,
					response.statusText
				);
			}
		} catch (err) {
			console.error("❌ Failed to fetch user stats:", err);
		}
	};

	// Helper function to calculate approval rate
	const getApprovalRate = (stats) => {
		if (!stats || stats.totalUploads === 0) return 0;
		return Math.round((stats.approvedCount / stats.totalUploads) * 100);
	};

	// Helper function to get approval rate color
	const getApprovalRateColor = (rate) => {
		if (rate >= 80) return "text-green-600 bg-green-100";
		if (rate >= 60) return "text-yellow-600 bg-yellow-100";
		if (rate >= 40) return "text-orange-600 bg-orange-100";
		return "text-red-600 bg-red-100";
	};

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		try {
			const response = await updateUserProfile(profileData);
			if (response.status === "success") {
				setUser(response.data.user);
				setSuccess("Profile updated successfully!");
			}
		} catch (err) {
			setError(err.message || "Failed to update profile");
		}
	};

	const handlePasswordUpdate = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		// Validate passwords match
		if (passwordData.password !== passwordData.passwordConfirm) {
			setError("New passwords do not match!");
			return;
		}

		try {
			const response = await updateUserPassword(
				passwordData.passwordCurrent,
				passwordData.password,
				passwordData.passwordConfirm
			);
			if (response.status === "success") {
				setSuccess("Password updated successfully!");
				setPasswordData({
					passwordCurrent: "",
					password: "",
					passwordConfirm: "",
				});
			}
		} catch (err) {
			setError(err.message || "Failed to update password");
		}
	};

	const handleUsernameUpdate = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		try {
			const res = await updateUsernameApi(username.trim());
			if (res.status === "success") {
				setUser(res.data.user);
				setSuccess("Username updated!");
			}
		} catch (err) {
			setError(err.message || "Failed to update username");
		}
	};

	// Removed Google reauth handlers

	const handleSetInitialPassword = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		if (initialPasswordData.password !== initialPasswordData.passwordConfirm) {
			setError("Passwords do not match!");
			return;
		}
		try {
			const res = await setInitialPasswordApi(
				initialPasswordData.password,
				initialPasswordData.passwordConfirm
			);
			if (res.status === "success") {
				setSuccess("Password set successfully!");
				setInitialPasswordData({ password: "", passwordConfirm: "" });
				// After setting password, fetch fresh profile
				const refreshed = await getUserProfile();
				if (refreshed.status === "success") setUser(refreshed.data.user);
			}
		} catch (err) {
			setError(err.message || "Failed to set password");
		}
	};

	// Friend group handlers
	const onCreateGroup = async (e) => {
		e.preventDefault();
		if (!newGroupName.trim()) return;
		try {
			await createFriendGroupApi({ name: newGroupName.trim() });
			setNewGroupName("");
			await fetchFriendGroups();
		} catch (err) {
			setError(err.message || "Failed to create group");
		}
	};

	const onAddToGroup = async (groupId, username) => {
		try {
			await addMemberToGroupApi(groupId, username);
			await fetchFriendGroups();
		} catch (err) {
			setError(err.message || "Failed to add member to group");
		}
	};

	const onRemoveFromGroup = async (groupId, username) => {
		try {
			await removeMemberFromGroupApi(groupId, username);
			await fetchFriendGroups();
		} catch (err) {
			setError(err.message || "Failed to remove member from group");
		}
	};

	const setGroupMemberInput = (groupId, value) =>
		setGroupMemberInputs((prev) => ({ ...prev, [groupId]: value }));

	const handleLogout = () => {
		userLogout();
		navigate("/");
	};

	// Add friend handler
	const handleAddFriend = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		const uname = friendUsername.trim().toLowerCase();
		if (!uname) return;
		try {
			const res = await addFriendApi(uname);
			setSuccess(res.message || "Friend added");
			setFriendUsername("");
			await fetchFriends();
		} catch (err) {
			setError(err.message || "Failed to add friend");
		}
	};

	// Remove friend handler
	const handleRemoveFriend = async (username) => {
		setError("");
		setSuccess("");
		try {
			const res = await removeFriendApi(username);
			setSuccess(res.message || "Friend removed");
			await fetchFriends();
		} catch (err) {
			setError(err.message || "Failed to remove friend");
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center pt-20">
				<div className="bg-white p-8 rounded-lg shadow-md">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading profile...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Enhanced Profile Header */}
				<div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
					<div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
						<div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
							<div className="relative">
								<div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
									{user?.name?.charAt(0)?.toUpperCase() || "U"}
								</div>
								<div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
									<span className="text-white text-xs font-bold">✓</span>
								</div>
							</div>
							<div className="text-center md:text-left">
								<h1 className="text-3xl font-bold text-gray-800 mb-2">
									{user?.name || "User"}
								</h1>
								<p className="text-gray-600 text-lg mb-3">{user?.email}</p>
								<div className="flex items-center justify-center md:justify-start space-x-4 flex-wrap">
									<span
										className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
											user?.role === "admin"
												? "bg-red-100 text-red-800 border border-red-200"
												: user?.role === "moderator"
												? "bg-blue-100 text-blue-800 border border-blue-200"
												: "bg-green-100 text-green-800 border border-green-200"
										}`}
									>
										🎯 {user?.role?.toUpperCase() || "USER"}
									</span>
									{user?.username && (
										<span className="inline-block px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-800 border border-gray-200">
											@ {user.username}
										</span>
									)}
									<span className="text-sm text-gray-500">
										📅 Member since{" "}
										{user?.createdAt
											? new Date(user.createdAt).toLocaleDateString("en-US", {
													month: "long",
													year: "numeric",
											  })
											: "Unknown"}
									</span>
								</div>

								{/* Academic Information */}
								<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											🏫 College
										</div>
										<div className="text-gray-800 capitalize">
											{user?.collegeName === "bhu"
												? "Banaras Hindu University (BHU)"
												: user?.collegeName === "nitk"
												? "National Institute of Technology Karnataka (NITK)"
												: user?.collegeName || "Not specified"}
										</div>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											📚 Course
										</div>
										<div className="text-gray-800 capitalize">
											{user?.course || "Not specified"}
										</div>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											🎓 Student Type
										</div>
										<div className="text-gray-800">
											{user?.studentType === "UG"
												? "Undergraduate"
												: user?.studentType === "PG"
												? "Postgraduate"
												: user?.studentType === "PhD"
												? "PhD Student"
												: user?.studentType || "Not specified"}
										</div>
									</div>
									<div className="bg-gray-50 p-3 rounded-lg">
										<div className="text-sm text-gray-600 font-medium">
											📝 Current Semester
										</div>
										<div className="text-gray-800">
											{user?.semester
												? `Semester ${user.semester}`
												: "Not specified"}
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
							<button
								onClick={fetchUserStats}
								className="w-full sm:w-auto px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-200 flex items-center justify-center space-x-2 shadow-md"
								title="Refresh statistics"
							>
								<span>🔄</span>
								<span>Refresh Stats</span>
							</button>
							<button
								onClick={handleLogout}
								className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition duration-300 shadow-md hover:shadow-lg"
							>
								🚪 Logout
							</button>
						</div>
					</div>
				</div>

				{/* User Statistics Dashboard */}
				{userStats && (
					<>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
							<div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-blue-100 text-sm font-medium">
											Total Uploads
										</p>
										<p className="text-3xl font-bold">
											{userStats.totalUploads}
										</p>
									</div>
									<div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">📊</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-green-100 text-sm font-medium">
											Approved
										</p>
										<p className="text-3xl font-bold">
											{userStats.approvedCount}
										</p>
									</div>
									<div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">✅</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-red-100 text-sm font-medium">Rejected</p>
										<p className="text-3xl font-bold">
											{userStats.rejectedCount}
										</p>
									</div>
									<div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">❌</span>
									</div>
								</div>
							</div>

							<div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-purple-100 text-sm font-medium">
											Success Rate
										</p>
										<p className="text-3xl font-bold">
											{getApprovalRate(userStats)}%
										</p>
									</div>
									<div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
										<span className="text-2xl">🎯</span>
									</div>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Pending Status Alert */}
				{userStats && userStats.pendingCount > 0 && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
								<span className="text-white text-lg">⏳</span>
							</div>
							<div>
								<h3 className="text-yellow-800 font-semibold text-lg">
									You have {userStats.pendingCount} upload
									{userStats.pendingCount !== 1 ? "s" : ""} pending review
								</h3>
								<p className="text-yellow-700">
									Your uploads are being reviewed by our moderation team. You'll
									be notified once they're approved.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Moderator Request Section */}
				{user &&
					!["moderator", "senior moderator", "admin"].includes(user.role) && (
						<div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6 mb-8">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
										<span className="text-white text-xl">👥</span>
									</div>
									<div>
										<h3 className="text-teal-800 font-semibold text-lg">
											Want to Help Moderate Content?
										</h3>
										<p className="text-teal-700 text-sm">
											Apply to become a moderator and help ensure quality
											educational resources for everyone
										</p>
									</div>
								</div>
								<button
									onClick={() => setShowModeratorRequestForm(true)}
									className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center space-x-2"
								>
									<span>🎯</span>
									<span>Apply for Moderator</span>
								</button>
							</div>
						</div>
					)}

				{/* Enhanced Tab Navigation */}
				<div className="bg-white rounded-xl shadow-lg overflow-hidden">
					<div className="border-b border-gray-200">
						<nav className="flex overflow-x-auto scrollbar-hide">
							<button
								onClick={() => setActiveTab("profile")}
								className={`flex-1 min-w-0 py-2 px-1 sm:py-3 sm:px-3 md:px-6 text-xs sm:text-sm font-medium flex flex-col items-center justify-center space-y-0.5 transition duration-200 ${
									activeTab === "profile"
										? "border-b-2 border-teal-500 text-teal-600 bg-teal-50"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="text-sm sm:text-base md:text-lg">👤</span>
								<span className="text-xs leading-tight">Profile</span>
							</button>
							<button
								onClick={() => setActiveTab("password")}
								className={`flex-1 min-w-0 py-2 px-1 sm:py-3 sm:px-3 md:px-6 text-xs sm:text-sm font-medium flex flex-col items-center justify-center space-y-0.5 transition duration-200 ${
									activeTab === "password"
										? "border-b-2 border-teal-500 text-teal-600 bg-teal-50"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="text-sm sm:text-base md:text-lg">🔒</span>
								<span className="text-xs leading-tight">Password</span>
							</button>
							{user?.googleId && (
								<button
									onClick={() => setActiveTab("drive")}
									className={`flex-1 min-w-0 py-2 px-1 sm:py-3 sm:px-3 md:px-6 text-xs sm:text-sm font-medium flex flex-col items-center justify-center space-y-0.5 transition duration-200 ${
										activeTab === "drive"
											? "border-b-2 border-teal-500 text-teal-600 bg-teal-50"
											: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
									}`}
								>
									<span className="text-sm sm:text-base md:text-lg">📁</span>
									<span className="text-xs leading-tight">Drive</span>
								</button>
							)}
							<button
								onClick={() => setActiveTab("friends")}
								className={`flex-1 min-w-0 py-2 px-1 sm:py-3 sm:px-3 md:px-6 text-xs sm:text-sm font-medium flex flex-col items-center justify-center space-y-0.5 transition duration-200 ${
									activeTab === "friends"
										? "border-b-2 border-teal-500 text-teal-600 bg-teal-50"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="text-sm sm:text-base md:text-lg">👥</span>
								<span className="text-xs leading-tight">Friends</span>
							</button>
						</nav>
					</div>

					<div className="p-8">
						{/* Error/Success Messages */}
						{error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-3">
								<span className="text-lg">❌</span>
								<span>{error}</span>
							</div>
						)}
						{success && (
							<div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center space-x-3">
								<span className="text-lg">✅</span>
								<span>{success}</span>
							</div>
						)}

						{/* Enhanced Profile Tab */}
						{activeTab === "profile" && (
							<div className="max-w-2xl">
								<div className="mb-8">
									<h2 className="text-2xl font-bold text-gray-800 mb-2">
										Personal Information
									</h2>
									<p className="text-gray-600">
										Update your account details and personal information.
									</p>
								</div>

								{/* Username section */}
								<div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
									<h3 className="text-lg font-semibold mb-4">Username</h3>
									<form onSubmit={handleUsernameUpdate} className="space-y-4">
										<div>
											<label className="block text-sm text-gray-700 mb-1">
												Choose your username
											</label>
											<input
												type="text"
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												placeholder="your.username"
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
											/>
											<p className="text-xs text-gray-500 mt-1">
												3-20 chars, lowercase letters, numbers, dot, underscore,
												or hyphen.
											</p>
										</div>
										<button
											type="submit"
											className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
										>
											Save Username
										</button>
									</form>
								</div>

								<form onSubmit={handleProfileUpdate} className="space-y-8">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>👤</span>
													<span>Full Name</span>
												</span>
											</label>
											<input
												type="text"
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={profileData.name}
												onChange={(e) =>
													setProfileData({
														...profileData,
														name: e.target.value,
													})
												}
												placeholder="Enter your full name"
											/>
										</div>

										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>📧</span>
													<span>Email Address</span>
												</span>
											</label>
											<input
												type="email"
												required
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={profileData.email}
												onChange={(e) =>
													setProfileData({
														...profileData,
														email: e.target.value,
													})
												}
												placeholder="Enter your email address"
											/>
										</div>
									</div>

									{/* Academic Information Section */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* College Field with Autocomplete */}
										<div className="relative college-autocomplete">
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>🏫</span>
													<span>College/University</span>
												</span>
											</label>
											<input
												type="text"
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={collegeSearch}
												onChange={(e) => handleCollegeSearch(e.target.value)}
												onFocus={() =>
													setShowCollegeSuggestions(collegeSearch.length > 0)
												}
												onBlur={handleCollegeBlur}
												placeholder="Type to search colleges..."
											/>
											{showCollegeSuggestions && (
												<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
													{filteredColleges.map((college) => (
														<div
															key={college.id}
															className="px-4 py-2 hover:bg-teal-50 cursor-pointer border-b border-gray-100"
															onClick={() => handleCollegeSelect(college)}
														>
															<div className="font-medium text-gray-900">
																{college.name}
															</div>
															<div className="text-sm text-gray-600">
																{college.shortName}
															</div>
														</div>
													))}
													{collegeSearch &&
														!filteredColleges.some(
															(c) =>
																c.name.toLowerCase() ===
																collegeSearch.toLowerCase()
														) && (
															<div
																className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200 bg-blue-50"
																onClick={() => {
																	setProfileData({
																		...profileData,
																		collegeName: collegeSearch.trim(),
																	});
																	setShowCollegeSuggestions(false);
																}}
															>
																<div className="font-medium text-blue-700">
																	Add "{collegeSearch}" as custom college
																</div>
																<div className="text-sm text-blue-600">
																	Click to use this custom college name
																</div>
															</div>
														)}
												</div>
											)}
										</div>

										{/* Course Field with Autocomplete */}
										<div className="relative course-autocomplete">
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>📚</span>
													<span>Course/Branch</span>
												</span>
											</label>
											<input
												type="text"
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={courseSearch}
												onChange={(e) => handleCourseSearch(e.target.value)}
												onFocus={() =>
													setShowCourseSuggestions(courseSearch.length > 0)
												}
												onBlur={handleCourseBlur}
												placeholder="Type to search courses..."
											/>
											{showCourseSuggestions && (
												<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
													{filteredCourses.map((course) => (
														<div
															key={course.key}
															className="px-4 py-2 hover:bg-teal-50 cursor-pointer border-b border-gray-100"
															onClick={() => handleCourseSelect(course)}
														>
															<div className="font-medium text-gray-900">
																{course.name}
															</div>
															<div className="text-sm text-gray-600">
																{course.college}
															</div>
														</div>
													))}
													{courseSearch &&
														!filteredCourses.some(
															(c) =>
																c.name.toLowerCase() ===
																courseSearch.toLowerCase()
														) && (
															<div
																className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200 bg-blue-50"
																onClick={() => {
																	setProfileData({
																		...profileData,
																		course: courseSearch.trim(),
																	});
																	setShowCourseSuggestions(false);
																}}
															>
																<div className="font-medium text-blue-700">
																	Add "{courseSearch}" as custom course
																</div>
																<div className="text-sm text-blue-600">
																	Click to use this custom course name
																</div>
															</div>
														)}
												</div>
											)}
										</div>

										{/* Student Type Field */}
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>🎓</span>
													<span>Student Type</span>
												</span>
											</label>
											<select
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={profileData.studentType}
												onChange={(e) =>
													setProfileData({
														...profileData,
														studentType: e.target.value,
													})
												}
											>
												<option value="">Select student type</option>
												<option value="UG">Undergraduate (UG)</option>
												<option value="PG">Postgraduate (PG)</option>
												<option value="PhD">PhD Scholar</option>
											</select>
										</div>

										{/* Semester Field */}
										<div>
											<label className="block text-sm font-semibold text-gray-700 mb-3">
												<span className="flex items-center space-x-2">
													<span>📝</span>
													<span>Current Semester</span>
												</span>
											</label>
											<select
												className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
												value={profileData.semester}
												onChange={(e) =>
													setProfileData({
														...profileData,
														semester: e.target.value,
													})
												}
											>
												<option value="">Select semester</option>
												{[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
													<option key={sem} value={sem}>
														Semester {sem}
													</option>
												))}
											</select>
										</div>
									</div>

									{/* Other Information Section */}
									<div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
										<h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center space-x-2">
											<span>ℹ️</span>
											<span>Additional Information</span>
											<span className="text-sm font-normal text-gray-600">
												(Optional)
											</span>
										</h3>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											{/* Phone Number */}
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>📱</span>
														<span>Phone Number</span>
													</span>
												</label>
												<input
													type="tel"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
													value={profileData.phoneNumber}
													onChange={(e) =>
														setProfileData({
															...profileData,
															phoneNumber: e.target.value,
														})
													}
													placeholder="Your phone number"
												/>
											</div>

											{/* LinkedIn Profile */}
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>💼</span>
														<span>LinkedIn Profile</span>
													</span>
												</label>
												<input
													type="url"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
													value={profileData.linkedinProfile}
													onChange={(e) =>
														setProfileData({
															...profileData,
															linkedinProfile: e.target.value,
														})
													}
													placeholder="https://linkedin.com/in/yourprofile"
												/>
											</div>

											{/* GitHub Profile */}
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>💻</span>
														<span>GitHub Profile</span>
													</span>
												</label>
												<input
													type="url"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
													value={profileData.githubProfile}
													onChange={(e) =>
														setProfileData({
															...profileData,
															githubProfile: e.target.value,
														})
													}
													placeholder="https://github.com/yourusername"
												/>
											</div>

											{/* Skills */}
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🚀</span>
														<span>Skills</span>
													</span>
												</label>
												<input
													type="text"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white"
													value={profileData.skills}
													onChange={(e) =>
														setProfileData({
															...profileData,
															skills: e.target.value,
														})
													}
													placeholder="e.g., Python, Java, Web Development"
												/>
											</div>
										</div>

										{/* Bio and Interests - Full Width */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
											{/* Bio */}
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>📝</span>
														<span>Bio</span>
													</span>
												</label>
												<textarea
													rows="4"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white resize-none"
													value={profileData.bio}
													onChange={(e) =>
														setProfileData({
															...profileData,
															bio: e.target.value,
														})
													}
													placeholder="Tell us a bit about yourself..."
												/>
											</div>

											{/* Interests */}
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🎯</span>
														<span>Interests</span>
													</span>
												</label>
												<textarea
													rows="4"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-white resize-none"
													value={profileData.interests}
													onChange={(e) =>
														setProfileData({
															...profileData,
															interests: e.target.value,
														})
													}
													placeholder="Your hobbies and interests..."
												/>
											</div>
										</div>
									</div>

									<div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
										<h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
											<span>📊</span>
											<span>Account Statistics</span>
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="text-center">
												<div className="text-2xl font-bold text-teal-600">
													{userStats?.totalUploads || 0}
												</div>
												<div className="text-sm text-gray-600">
													Total Uploads
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-green-600">
													{userStats?.approvedCount || 0}
												</div>
												<div className="text-sm text-gray-600">Approved</div>
											</div>
											<div className="text-center">
												<div
													className={`text-2xl font-bold px-3 py-1 rounded-lg ${
														userStats
															? getApprovalRateColor(getApprovalRate(userStats))
															: "text-gray-600"
													}`}
												>
													{userStats ? getApprovalRate(userStats) : 0}%
												</div>
												<div className="text-sm text-gray-600">
													Success Rate
												</div>
											</div>
										</div>
									</div>

									<div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
										<h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
											<span>📅</span>
											<span>Member Information</span>
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-600 mb-1">
													Member Since
												</label>
												<p className="text-lg font-semibold text-gray-800">
													{user?.createdAt
														? new Date(user.createdAt).toLocaleDateString(
																"en-US",
																{
																	weekday: "long",
																	year: "numeric",
																	month: "long",
																	day: "numeric",
																}
														  )
														: "Unknown"}
												</p>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-600 mb-1">
													Account Type
												</label>
												<span
													className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
														user?.role === "admin"
															? "bg-red-100 text-red-800 border border-red-200"
															: user?.role === "moderator"
															? "bg-blue-100 text-blue-800 border border-blue-200"
															: "bg-green-100 text-green-800 border border-green-200"
													}`}
												>
													{user?.role?.toUpperCase() || "USER"}
												</span>
											</div>
										</div>
									</div>

									<div className="flex justify-end">
										<button
											type="submit"
											className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition duration-300 shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
										>
											<span>💾</span>
											<span>Update Profile</span>
										</button>
									</div>
								</form>
							</div>
						)}

						{/* Enhanced Password Tab */}
						{activeTab === "password" && (
							<div className="max-w-2xl">
								<div className="mb-8">
									<h2 className="text-2xl font-bold text-gray-800 mb-2">
										Security Settings
									</h2>
									<p className="text-gray-600">
										Update your password to keep your account secure.
									</p>
								</div>

								{/* If user hasn't set a password (e.g., Google sign-in), show initial password form */}
								{user && user.isPasswordSet === false ? (
									<form
										onSubmit={handleSetInitialPassword}
										className="space-y-8"
									>
										<div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
											<div className="flex items-center space-x-3">
												<span className="text-2xl">🆕</span>
												<div>
													<h3 className="font-semibold text-blue-800">
														Set your password
													</h3>
													<p className="text-blue-700 text-sm">
														You signed up with Google. Set a password to enable
														email + password login.
													</p>
												</div>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🔒</span>
														<span>New Password</span>
													</span>
												</label>
												<input
													type="password"
													required
													minLength="5"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
													value={initialPasswordData.password}
													onChange={(e) =>
														setInitialPasswordData({
															...initialPasswordData,
															password: e.target.value,
														})
													}
													placeholder="Enter new password (min 5 characters)"
												/>
											</div>

											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🔒</span>
														<span>Confirm New Password</span>
													</span>
												</label>
												<input
													type="password"
													required
													minLength="5"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
													value={initialPasswordData.passwordConfirm}
													onChange={(e) =>
														setInitialPasswordData({
															...initialPasswordData,
															passwordConfirm: e.target.value,
														})
													}
													placeholder="Confirm new password"
												/>
											</div>
										</div>

										<div className="flex justify-end">
											<button
												type="submit"
												className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition duration-300 shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
											>
												<span>✅</span>
												<span>Set Password</span>
											</button>
										</div>
									</form>
								) : (
									<form onSubmit={handlePasswordUpdate} className="space-y-8">
										<div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-6">
											<div className="flex items-center space-x-3">
												<span className="text-2xl">🔐</span>
												<div>
													<h3 className="font-semibold text-yellow-800">
														Password Tips
													</h3>
													<p className="text-yellow-700 text-sm">
														Minimum 5 characters. Longer is stronger.
													</p>
												</div>
											</div>
										</div>

										{/* Messaging explaining the rule */}
										{user?.googleId ? (
											<div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 text-blue-800 text-sm">
												You linked Google to this account. To change your
												password, log in using Google.
											</div>
										) : (
											<div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 text-blue-800 text-sm">
												Provide your current password to change it.
											</div>
										)}

										{!user?.googleId && (
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🔓</span>
														<span>Current Password</span>
													</span>
												</label>
												<input
													type="password"
													required
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
													value={passwordData.passwordCurrent}
													onChange={(e) =>
														setPasswordData({
															...passwordData,
															passwordCurrent: e.target.value,
														})
													}
													placeholder="Enter your current password"
												/>
											</div>
										)}

										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🔒</span>
														<span>New Password</span>
													</span>
												</label>
												<input
													type="password"
													required
													minLength="5"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
													value={passwordData.password}
													onChange={(e) =>
														setPasswordData({
															...passwordData,
															password: e.target.value,
														})
													}
													placeholder="Enter new password (min 5 characters)"
												/>
											</div>

											<div>
												<label className="block text-sm font-semibold text-gray-700 mb-3">
													<span className="flex items-center space-x-2">
														<span>🔒</span>
														<span>Confirm New Password</span>
													</span>
												</label>
												<input
													type="password"
													required
													minLength="5"
													className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
													value={passwordData.passwordConfirm}
													onChange={(e) =>
														setPasswordData({
															...passwordData,
															passwordConfirm: e.target.value,
														})
													}
													placeholder="Confirm new password"
												/>
											</div>
										</div>

										{/* Password Strength Indicator (min 5 chars) */}
										{passwordData.password && (
											<div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
												<h4 className="text-sm font-semibold text-gray-700 mb-2">
													Password Check:
												</h4>
												<div
													className={`flex items-center space-x-2 ${
														passwordData.password.length >= 5
															? "text-green-600"
															: "text-gray-400"
													}`}
												>
													<span>
														{passwordData.password.length >= 5 ? "✅" : "⭕"}
													</span>
													<span className="text-sm">At least 5 characters</span>
												</div>
											</div>
										)}

										<div className="flex justify-end">
											<button
												type="submit"
												className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition duration-300 shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
											>
												<span>🔐</span>
												<span>Update Password</span>
											</button>
										</div>
									</form>
								)}
							</div>
						)}

						{/* Personal Drive Tab */}
						{activeTab === "drive" && (
							<div className="max-w-3xl">
								<PersonalDrive isGoogleLinked={Boolean(user?.googleId)} />
							</div>
						)}

						{/* Friends List Tab */}
						{activeTab === "friends" && (
							<div className="max-w-2xl">
								<div className="mb-8">
									<h2 className="text-2xl font-bold text-gray-800 mb-2">
										Friends List
									</h2>
									<p className="text-gray-600">
										Manage your friends and connections.
									</p>
								</div>

								{/* Friend Groups Section */}
								<div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
									<h3 className="text-lg font-semibold mb-4">Friend Groups</h3>
									<form onSubmit={onCreateGroup} className="flex gap-3 mb-4">
										<input
											type="text"
											value={newGroupName}
											onChange={(e) => setNewGroupName(e.target.value)}
											placeholder="New group name (e.g., CSE 2021)"
											className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
										/>
										<button
											type="submit"
											className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
										>
											Create Group
										</button>
									</form>

									{friendGroups.length === 0 ? (
										<p className="text-gray-500 text-sm">
											No groups yet. Create one to organize friends by batch.
										</p>
									) : (
										<div className="space-y-6">
											{friendGroups.map((g) => (
												<div key={g.id} className="border rounded-lg p-4">
													<div className="flex items-center justify-between mb-3">
														<div>
															<div className="font-semibold">{g.name}</div>
															<div className="text-sm text-gray-600">
																{g.members?.length || 0} member(s)
															</div>
														</div>
														<div className="flex items-center gap-2">
															<input
																value={groupMemberInputs[g.id] || ""}
																onChange={(e) =>
																	setGroupMemberInput(g.id, e.target.value)
																}
																placeholder="username"
																className="px-3 py-2 border rounded"
															/>
															<button
																onClick={() => {
																	const u = (groupMemberInputs[g.id] || "")
																		.trim()
																		.toLowerCase();
																	if (!u) return;
																	onAddToGroup(g.id, u);
																	setGroupMemberInput(g.id, "");
																}}
																className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
															>
																Add Member
															</button>
														</div>
													</div>
													{g.members?.length ? (
														<ul className="flex flex-wrap gap-2">
															{g.members.map((m) => (
																<li
																	key={m.id}
																	className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-2"
																>
																	<span>@{m.username}</span>
																	<button
																		onClick={() =>
																			onRemoveFromGroup(g.id, m.username)
																		}
																		className="text-red-600 hover:underline"
																	>
																		Remove
																	</button>
																</li>
															))}
														</ul>
													) : (
														<div className="text-sm text-gray-600">
															No members yet.
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</div>

								{/* Add Friend Form */}
								<div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
									<h3 className="text-lg font-semibold mb-4">Add a Friend</h3>
									<form onSubmit={handleAddFriend} className="flex space-x-4">
										<div className="flex-1 min-w-0">
											<label className="block text-sm text-gray-700 mb-1">
												Friend's Username
											</label>
											<input
												type="text"
												value={friendUsername}
												onChange={(e) => setFriendUsername(e.target.value)}
												placeholder="Enter username"
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
											/>
										</div>
										<button
											type="submit"
											className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
										>
											Add Friend
										</button>
									</form>
								</div>

								{/* Friends List Table */}
								<div className="bg-white rounded-xl border border-gray-200 p-6">
									<h3 className="text-lg font-semibold mb-4">Your Friends</h3>
									{friends.length === 0 ? (
										<p className="text-gray-500 text-sm">
											No friends added yet. Start by adding some friends!
										</p>
									) : (
										<table className="min-w-full divide-y divide-gray-200">
											<thead className="bg-gray-50">
												<tr>
													<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
														Username
													</th>
													<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
														Full Name
													</th>
													<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
														Email
													</th>
													<th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
														Actions
													</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{friends.map((friend) => (
													<tr key={friend.id}>
														<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
															{friend.username}
														</td>
														<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
															{friend.name || ""}
														</td>
														<td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
															{friend.email}
														</td>
														<td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
															<button
																className="text-red-600 hover:text-red-800"
																onClick={() =>
																	handleRemoveFriend(friend.username)
																}
															>
																Remove
															</button>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Moderator Request Form Modal */}
			{showModeratorRequestForm && (
				<ModeratorRequestForm
					onClose={() => setShowModeratorRequestForm(false)}
					onSuccess={(message) => {
						setSuccess(message);
						setShowModeratorRequestForm(false);
					}}
				/>
			)}
		</div>
	);
}

export default Profile;
