import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
import UploadWrapper from "../components/Upload/UploadWrapper.jsx";
import { isUserLoggedIn } from "../services/userService.js";

const Upload = () => {
	// const navigate = useNavigate();
	const [authenticated, setAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Soft check login; uploading can be open if admin toggled it on
		const checkAuth = async () => {
			const loggedIn = await isUserLoggedIn();
			setAuthenticated(!!loggedIn);
			setLoading(false);
		};
		checkAuth();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg">Checking authentication...</p>
			</div>
		);
	}

	return (
		<>
			{!authenticated && (
				<div className="mt-20 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm">
					You are uploading as a guest. For attribution and faster approval,
					please log in.
				</div>
			)}
			<UploadWrapper />
		</>
	);
};

export default Upload;
