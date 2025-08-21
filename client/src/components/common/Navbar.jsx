import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isUserLoggedIn, userLogout } from "../../services/userService";
import NotificationsBell from "./NotificationsBell";

function Navbar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [showProfileDropdown, setShowProfileDropdown] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		// Check if user is logged in on component mount and when localStorage changes
		const checkLoginStatus = () => {
			const loginStatus = isUserLoggedIn();
			setIsLoggedIn(loginStatus);
			console.log(
				"Login status checked:",
				loginStatus,
				"Token:",
				localStorage.getItem("userToken")
			); // Debug log
		};

		checkLoginStatus();

		// Listen for storage changes (login/logout in other tabs)
		window.addEventListener("storage", checkLoginStatus);

		// Listen for custom login/logout events
		window.addEventListener("userLogin", checkLoginStatus);
		window.addEventListener("userLogout", checkLoginStatus);

		// Check login status periodically (every 2 minutes)
		const interval = setInterval(checkLoginStatus, 120000);

		// Close dropdown when clicking outside
		const handleClickOutside = (event) => {
			if (
				showProfileDropdown &&
				!event.target.closest(".profile-dropdown-container")
			) {
				setShowProfileDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			window.removeEventListener("storage", checkLoginStatus);
			window.removeEventListener("userLogin", checkLoginStatus);
			window.removeEventListener("userLogout", checkLoginStatus);
			document.removeEventListener("mousedown", handleClickOutside);
			clearInterval(interval);
		};
	}, [showProfileDropdown]);

	// Check login status whenever the route changes
	useEffect(() => {
		const checkLoginStatus = () => {
			const loginStatus = isUserLoggedIn();
			setIsLoggedIn(loginStatus);
			console.log("Route changed - Login status checked:", loginStatus); // Debug log
		};

		checkLoginStatus();
	}, [location.pathname]);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const handleLogout = () => {
		userLogout();
		setIsLoggedIn(false);
		setShowProfileDropdown(false);
		navigate("/");
	};

	return (
		<nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-teal-500/10 fixed top-0 left-0 right-0 z-50">
			<div className="max-w-6xl mx-auto px-5 flex justify-between items-center h-18">
				{/* Logo */}
				<Link
					to="/"
					className="text-3xl md:text-2xl font-bold bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent no-underline font-montserrat transition-all duration-300 hover:scale-105 hover:drop-shadow-lg"
				>
					College Notes
				</Link>

				{/* Desktop Menu */}
				<div className="hidden md:flex items-center gap-8">
					<ul className="flex list-none m-0 p-0 gap-6">
						<li>
							<Link
								to="/"
								className="relative text-gray-700 no-underline font-semibold text-base py-3 px-5 rounded-xl transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm hover:shadow-md hover:border hover:border-teal-200/50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-teal-400 after:to-blue-500 after:transition-all after:duration-300 hover:after:w-full"
							>
								Home
							</Link>
						</li>
						<li>
							<Link
								to="/books"
								className="relative text-gray-700 no-underline font-semibold text-base py-3 px-5 rounded-xl transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm hover:shadow-md hover:border hover:border-teal-200/50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-teal-400 after:to-blue-500 after:transition-all after:duration-300 hover:after:w-full"
							>
								Books
							</Link>
						</li>
						<li>
							<Link
								to="/about"
								className="relative text-gray-700 no-underline font-semibold text-base py-3 px-5 rounded-xl transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm hover:shadow-md hover:border hover:border-teal-200/50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-teal-400 after:to-blue-500 after:transition-all after:duration-300 hover:after:w-full"
							>
								About
							</Link>
						</li>
						<li>
							<Link
								to="/contact"
								className="relative text-gray-700 no-underline font-semibold text-base py-3 px-5 rounded-xl transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm hover:shadow-md hover:border hover:border-teal-200/50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-teal-400 after:to-blue-500 after:transition-all after:duration-300 hover:after:w-full"
							>
								Contact
							</Link>
						</li>
						<li>
							<Link
								to="/upload"
								className="relative text-gray-700 no-underline font-semibold text-base py-3 px-5 rounded-xl transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm hover:shadow-md hover:border hover:border-teal-200/50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-teal-400 after:to-blue-500 after:transition-all after:duration-300 hover:after:w-full"
							>
								Upload
							</Link>
						</li>
					</ul>

					{/* User Profile or Login */}
					{isLoggedIn ? (
						<div className="relative profile-dropdown-container flex items-center gap-2">
							<NotificationsBell />
							<button
								onClick={() => setShowProfileDropdown(!showProfileDropdown)}
								className="flex items-center space-x-2 bg-gradient-to-r from-teal-100/80 to-blue-100/80 backdrop-blur-sm hover:from-teal-200/80 hover:to-blue-200/80 text-teal-700 px-4 py-2 rounded-full transition-all duration-300 shadow-md border border-teal-200/50 hover:shadow-lg hover:scale-105"
							>
								<div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-inner">
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<svg
									className="w-4 h-4"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
							</button>

							{/* Profile Dropdown */}
							{showProfileDropdown && (
								<div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-xl py-2 z-50 border border-white/30">
									<Link
										to="/profile"
										className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 transition-all duration-200 rounded-lg mx-2"
										onClick={() => setShowProfileDropdown(false)}
									>
										👤 My Profile
									</Link>
									<button
										onClick={handleLogout}
										className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-all duration-200 rounded-lg mx-2"
									>
										🚪 Logout
									</button>
								</div>
							)}
						</div>
					) : (
						<Link
							to="/login"
							className="bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:from-teal-600 hover:to-blue-600 hover:shadow-lg transform hover:-translate-y-0.5 backdrop-blur-sm border border-white/20"
						>
							Login
						</Link>
					)}

					{/* Admin Login Button */}
					<Link
						to="/admin"
						className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:shadow-lg transform hover:-translate-y-0.5 backdrop-blur-sm border border-white/20"
					>
						🔐 Admin
					</Link>
				</div>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden flex flex-col bg-transparent border-none cursor-pointer p-2 gap-1.5 group rounded-lg hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 transition-all duration-300"
					onClick={toggleMenu}
					aria-label="Toggle menu"
				>
					<span className="w-6 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 group-hover:bg-teal-500"></span>
					<span className="w-6 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 group-hover:bg-teal-500"></span>
					<span className="w-6 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 group-hover:bg-teal-500"></span>
				</button>

				{/* Mobile Menu */}
				<div
					className={`md:hidden absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/20 shadow-2xl p-6 transition-all duration-300 ${
						isMenuOpen
							? "translate-y-0 opacity-100 visible"
							: "-translate-y-2 opacity-0 invisible"
					}`}
				>
					<Link
						to="/"
						className="block text-gray-700 no-underline font-semibold py-4 border-b border-gray-100/50 transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm rounded-lg px-3 last:border-b-0"
						onClick={toggleMenu}
					>
						Home
					</Link>
					<Link
						to="/books"
						className="block text-gray-700 no-underline font-semibold py-4 border-b border-gray-100/50 transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm rounded-lg px-3 last:border-b-0"
						onClick={toggleMenu}
					>
						Books
					</Link>
					<Link
						to="/about"
						className="block text-gray-700 no-underline font-semibold py-4 border-b border-gray-100/50 transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm rounded-lg px-3 last:border-b-0"
						onClick={toggleMenu}
					>
						About
					</Link>
					<Link
						to="/contact"
						className="block text-gray-700 no-underline font-semibold py-4 border-b border-gray-100/50 transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm rounded-lg px-3 last:border-b-0"
						onClick={toggleMenu}
					>
						Contact
					</Link>
					<Link
						to="/upload"
						className="block text-gray-700 no-underline font-semibold py-4 border-b border-gray-100/50 transition-all duration-300 hover:text-teal-600 hover:bg-gradient-to-r hover:from-teal-50/80 hover:to-blue-50/80 hover:backdrop-blur-sm rounded-lg px-3 last:border-b-0"
						onClick={toggleMenu}
					>
						Upload
					</Link>

					{/* Mobile User Actions */}
					{isLoggedIn ? (
						<div className="pt-6 space-y-3">
							<div className="flex items-center justify-between">
								<NotificationsBell />
								<Link
									to="/admin"
									className="block bg-gradient-to-r from-gray-500 to-gray-600 text-white text-center font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:from-gray-600 hover:to-gray-700 shadow-md backdrop-blur-sm"
									onClick={toggleMenu}
								>
									🔐 Admin
								</Link>
							</div>
							<Link
								to="/profile"
								className="block bg-gradient-to-r from-teal-500 to-blue-500 text-white text-center font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:from-teal-600 hover:to-blue-600 shadow-md backdrop-blur-sm"
								onClick={toggleMenu}
							>
								👤 My Profile
							</Link>
							<button
								onClick={() => {
									handleLogout();
									toggleMenu();
								}}
								className="block w-full bg-gradient-to-r from-red-500 to-red-600 text-white text-center font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:from-red-600 hover:to-red-700 shadow-md backdrop-blur-sm"
							>
								🚪 Logout
							</button>
						</div>
					) : (
						<Link
							to="/login"
							className="block bg-gradient-to-r from-teal-500 to-blue-500 text-white text-center font-semibold py-3 px-4 mt-6 rounded-xl transition-all duration-300 hover:from-teal-600 hover:to-blue-600 shadow-md backdrop-blur-sm"
							onClick={toggleMenu}
						>
							🔑 Login
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
