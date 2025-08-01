import React from "react";
import BScBooks from "../components/Books/Bsc/Books.jsx";
import "../styles/pages/Books.module.css";

const Books = () => {
	return (
		<div className="books">
			{/* will add other Course components later */}
			{/* <BScBooks /> */}
			<div class="text-center mt-26 px-4">
				<h1 class="text-3xl font-bold text-gray-800 mb-4">
					📚 Books Section - Under Development
				</h1>
				<p class="text-gray-700 max-w-xl mx-auto text-base leading-relaxed">
					We're working hard to bring you a curated collection of academic
					books. Due to their large file sizes, we're optimizing storage and
					hosting to ensure smooth and cost-effective access for all students.
					<span class="font-semibold text-gray-800">
						Thank you for your patience and support!
					</span>
				</p>
				<p class="text-sm text-gray-600 mt-6">
					<span class="font-semibold">
						Want to contribute or get involved?{" "}
					</span>
					Email us at{" "}
					<a
						href="mailto:notes.helper0@gmail.com"
						class="text-blue-600 font-medium underline"
					>
						notes.helper0@gmail.com{" "}
					</a>
					or connect with the developer on{" "}
					<a
						href="https://www.linkedin.com/in/satishshekhar/"
						target="_blank"
						class="text-blue-600 font-medium underline"
					>
						LinkedIn
					</a>
					.
				</p>
			</div>
		</div>
	);
};

export default Books;
