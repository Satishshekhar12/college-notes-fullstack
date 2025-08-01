import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadWrapper from "../components/Upload/UploadWrapper.jsx";
import { isUserLoggedIn } from "../services/userService.js";

const Upload = () => {
	const navigate = useNavigate();
	const [authenticated, setAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check if user is logged in
		const checkAuth = async () => {
			const loggedIn = await isUserLoggedIn();

			if (!loggedIn) {
				alert("Please log in to upload files");
				navigate("/login");
			} else {
				setAuthenticated(true);
			}
			setLoading(false);
		};

		checkAuth();
	}, [navigate]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg">Checking authentication...</p>
			</div>
		);
	}

	return authenticated ? <UploadWrapper /> : null;
};

export default Upload;
