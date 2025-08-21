import React, { useState } from "react";
import ModeratorRequestForm from "./ModeratorRequestForm";
import { isUserLoggedIn } from "../../services/userService";

function ModeratorRequestButton({ className = "" }) {
	const [showForm, setShowForm] = useState(false);

	const handleClick = () => {
		if (!isUserLoggedIn()) {
			alert("Please log in first to apply for moderator role.");
			return;
		}
		setShowForm(true);
	};

	return (
		<>
			<button
				onClick={handleClick}
				className={`bg-gradient-to-r from-teal-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-300 font-medium flex items-center space-x-2 shadow-md hover:shadow-lg ${className}`}
			>
				<span>👥</span>
				<span>Become a Moderator</span>
			</button>

			{showForm && (
				<ModeratorRequestForm
					onClose={() => setShowForm(false)}
					onSuccess={(message) => {
						setShowForm(false);
						alert(message);
					}}
				/>
			)}
		</>
	);
}

export default ModeratorRequestButton;
