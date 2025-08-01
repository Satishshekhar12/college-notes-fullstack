import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/common/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import SimpleFooter from "./components/common/SimpleFooter.jsx";
import About from "./pages/About.jsx";
import Books from "./pages/Books.jsx";
import Contact from "./pages/Contact.jsx";
import Upload from "./pages/Upload.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import ResetPassword from "./components/admin/ResetPassword.jsx";
import UserResetPassword from "./components/auth/UserResetPassword.jsx";
import NITKCoursePage from "./components/college/NITK/NITKCoursePage.jsx";
import BHUCoursePage from "./components/college/BHU/BHUCoursePage.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";
import "./App.css";

function App() {
	return (
		<Router>
			<ScrollToTop />
			<div className="App">
				<Navbar />
				<Routes>
					<Route
						path="/"
						element={
							<>
								<HomePage />
							</>
						}
					/>
					<Route path="/books" element={<Books />} />
					<Route path="/about" element={<About />} />
					<Route path="/contact" element={<Contact />} />
					<Route path="/upload" element={<Upload />} />
					<Route path="/login" element={<Login />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="/admin" element={<Admin />} />
					<Route path="/reset-password/:token" element={<ResetPassword />} />
					<Route path="/nitk/:courseId" element={<NITKCoursePage />} />
					<Route path="/bhu/:degreeType" element={<BHUCoursePage />} />
				</Routes>
				<SimpleFooter />
			</div>
		</Router>
	);
}

export default App;
