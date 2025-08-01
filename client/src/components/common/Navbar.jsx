import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isUserLoggedIn, userLogout } from "../../services/userService";

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
		<nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
			<div className="max-w-6xl mx-auto px-5 flex justify-between items-center h-18">
				{/* Logo */}
				<Link
					to="/"
					className="text-3xl md:text-2xl font-bold text-teal-400 no-underline font-montserrat transition-colors duration-300 hover:text-teal-600"
				>
					College Notes
				</Link>

				{/* Desktop Menu */}
				<div className="hidden md:flex items-center gap-8">
					<ul className="flex list-none m-0 p-0 gap-8">
						<li>
							<Link
								to="/"
								className="relative text-gray-700 no-underline font-medium text-base py-2 px-4 rounded-lg transition-all duration-300 hover:text-teal-400 hover:bg-teal-50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full"
							>
								Home
							</Link>
						</li>
						<li>
							<Link
								to="/books"
								className="relative text-gray-700 no-underline font-medium text-base py-2 px-4 rounded-lg transition-all duration-300 hover:text-teal-400 hover:bg-teal-50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full"
							>
								Books
							</Link>
						</li>
						<li>
							<Link
								to="/about"
								className="relative text-gray-700 no-underline font-medium text-base py-2 px-4 rounded-lg transition-all duration-300 hover:text-teal-400 hover:bg-teal-50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full"
							>
								About
							</Link>
						</li>
						<li>
							<Link
								to="/contact"
								className="relative text-gray-700 no-underline font-medium text-base py-2 px-4 rounded-lg transition-all duration-300 hover:text-teal-400 hover:bg-teal-50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full"
							>
								Contact
							</Link>
						</li>
						<li>
							<Link
								to="/upload"
								className="relative text-gray-700 no-underline font-medium text-base py-2 px-4 rounded-lg transition-all duration-300 hover:text-teal-400 hover:bg-teal-50 after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-teal-400 after:transition-all after:duration-300 hover:after:w-full"
							>
								Upload
							</Link>
						</li>
					</ul>

					{/* User Profile or Login */}
					{isLoggedIn ? (
						<div className="relative profile-dropdown-container">
							<button
								onClick={() => setShowProfileDropdown(!showProfileDropdown)}
								className="flex items-center space-x-2 bg-teal-100 hover:bg-teal-200 text-teal-700 px-3 py-2 rounded-full transition-all duration-300"
							>
								<div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
								<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
									<Link
										to="/profile"
										className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
										onClick={() => setShowProfileDropdown(false)}
									>
										👤 My Profile
									</Link>
									<button
										onClick={handleLogout}
										className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
									>
										🚪 Logout
									</button>
								</div>
							)}
						</div>
					) : (
						<Link
							to="/login"
							className="bg-teal-100 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-teal-600 hover:text-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
						>
							Login
						</Link>
					)}

					{/* Admin Login Button */}
					<Link
						to="/admin"
						className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gray-600 hover:shadow-lg transform hover:-translate-y-0.5"
					>
						🔐 Admin
					</Link>
				</div>

				{/* Mobile Menu Button */}
				<button
					className="md:hidden flex flex-col bg-transparent border-none cursor-pointer p-1 gap-1 group"
					onClick={toggleMenu}
					aria-label="Toggle menu"
				>
					<span className="w-6 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 group-hover:bg-teal-400"></span>
					<span className="w-6 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 group-hover:bg-teal-400"></span>
					<span className="w-6 h-0.5 bg-gray-700 rounded-sm transition-all duration-300 group-hover:bg-teal-400"></span>
				</button>

				{/* Mobile Menu */}
				<div
					className={`md:hidden absolute top-full left-0 right-0 bg-white shadow-lg p-5 transition-all duration-300 ${
						isMenuOpen
							? "translate-y-0 opacity-100 visible"
							: "-translate-y-2 opacity-0 invisible"
					}`}
				>
					<Link
						to="/"
						className="block text-gray-700 no-underline font-medium py-4 border-b border-gray-100 transition-colors duration-300 hover:text-teal-400 last:border-b-0"
						onClick={toggleMenu}
					>
						Home
					</Link>
					<Link
						to="/books"
						className="block text-gray-700 no-underline font-medium py-4 border-b border-gray-100 transition-colors duration-300 hover:text-teal-400 last:border-b-0"
						onClick={toggleMenu}
					>
						Books
					</Link>
					<Link
						to="/about"
						className="block text-gray-700 no-underline font-medium py-4 border-b border-gray-100 transition-colors duration-300 hover:text-teal-400 last:border-b-0"
						onClick={toggleMenu}
					>
						About
					</Link>
					<Link
						to="/contact"
						className="block text-gray-700 no-underline font-medium py-4 border-b border-gray-100 transition-colors duration-300 hover:text-teal-400 last:border-b-0"
						onClick={toggleMenu}
					>
						Contact
					</Link>
					<Link
						to="/upload"
						className="block text-gray-700 no-underline font-medium py-4 border-b border-gray-100 transition-colors duration-300 hover:text-teal-400 last:border-b-0"
						onClick={toggleMenu}
					>
						Upload
					</Link>

					{/* Mobile User Actions */}
					{isLoggedIn ? (
						<div className="pt-4 space-y-2">
							<Link
								to="/profile"
								className="block bg-teal-500 text-white text-center font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:bg-teal-600"
								onClick={toggleMenu}
							>
								👤 My Profile
							</Link>
							<button
								onClick={() => {
									handleLogout();
									toggleMenu();
								}}
								className="block w-full bg-red-500 text-white text-center font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:bg-red-600"
							>
								🚪 Logout
							</button>
						</div>
					) : (
						<Link
							to="/login"
							className="block bg-teal-500 text-white text-center font-medium py-3 px-4 mt-4 rounded-lg transition-all duration-300 hover:bg-teal-600"
							onClick={toggleMenu}
						>
							� Login
						</Link>
					)}

					<Link
						to="/admin"
						className="block bg-gray-500 text-white text-center font-medium py-3 px-4 mt-2 rounded-lg transition-all duration-300 hover:bg-gray-600"
						onClick={toggleMenu}
					>
						🔐 Admin
					</Link>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
