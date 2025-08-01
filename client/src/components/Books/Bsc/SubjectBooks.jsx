import React, { useState, useEffect } from "react";
import BookCard from "./BookCard.jsx";

const SubjectBooks = ({ subject }) => {
	const [books, setBooks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const loadSubjectBooks = async () => {
			setLoading(true);
			setError(null);

			try {
				// Dynamically import the subject's JSON file
				const booksData = await import(`../../../data/books/${subject}.json`);
				setBooks(booksData.default || booksData);
			} catch (err) {
				console.log(`No data file found for ${subject}:`, err.message);
				setError(
					`Coming Soon! Books for ${subject} will be available shortly.`
				);
			} finally {
				setLoading(false);
			}
		};

		if (subject) {
			loadSubjectBooks();
		}
	}, [subject]);

	if (loading) {
		return (
			<div className="py-8 px-5 text-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 text-lg rounded-xl my-5">
				<span className="inline-block w-5 h-5 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></span>
				Loading books for {subject}...
			</div>
		);
	}

	if (error) {
		return (
			<div className="py-8 px-5 text-center bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-800 italic border border-yellow-200 rounded-xl my-5">
				{error}
			</div>
		);
	}

	if (!books || books.length === 0) {
		return (
			<div className="py-8 px-5 text-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border border-blue-200 rounded-xl my-5">
				No books available for {subject} at the moment.
			</div>
		);
	}

	return (
		<div className="p-5">
			<h4 className="m-0 mb-5 text-teal-500 text-xl font-semibold">
				Available Books ({books.length})
			</h4>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5 mt-5">
				{books.map((book, index) => (
					<BookCard key={book.id || index} book={book} />
				))}
			</div>
		</div>
	);
};

export default SubjectBooks;
