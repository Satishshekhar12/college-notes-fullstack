import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const Dashboard = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const exchange = async () => {
			try {
				const res = await fetch(`${API_BASE_URL}/api/auth/token`, {
					method: "GET",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				});
				const data = await res.json();
				if (res.ok && data.status === "success" && data.token) {
					localStorage.setItem("userToken", data.token);
					window.dispatchEvent(new Event("userLogin"));
					navigate("/profile", { replace: true });
				} else {
					navigate("/login", { replace: true });
				}
			} catch {
				navigate("/login", { replace: true });
			}
		};
		exchange();
	}, [navigate]);

	return (
		<div className="min-h-screen flex items-center justify-center pt-20">
			<p className="text-gray-600">Signing you in…</p>
		</div>
	);
};

export default Dashboard;
