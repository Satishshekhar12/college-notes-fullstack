// import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../../styles/SimpleFooter.module.css";
import { API_BASE_URL } from "../../config/api";

function SimpleFooter() {
	// const [visitCount, setVisitCount] = useState(0);
	// const isFirstRender = useRef(true);

	// const handleLocalStorageFallback = useCallback((increment = true) => {
	// 	const currentCount = localStorage.getItem("globalCollegeNotesVisitCount");
	// 	let newCount;

	// 	if (increment) {
	// 		// Increment by a random value between 3 and 5
	// 		// const randomInc = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
	// 		newCount = currentCount ? parseInt(currentCount) + 1 : 1;
	// 		localStorage.setItem("globalCollegeNotesVisitCount", newCount.toString());
	// 	} else {
	// 		newCount = currentCount ? parseInt(currentCount) : 0;
	// 	}

	// 	setVisitCount(newCount);
	// }, []);

	// const incrementGlobalVisitCount = useCallback(async () => {
	// 	try {
	// 		// Always increment the global count on every refresh
	// 		try {
	// 			const response = await fetch(`${API_BASE_URL}/api/visit-counter`, {
	// 				method: "POST",
	// 				headers: {
	// 					"Content-Type": "application/json",
	// 				},
	// 			});
	// 			if (response.ok) {
	// 				const data = await response.json();
	// 				setVisitCount(data.count);
	// 			} else {
	// 				handleLocalStorageFallback();
	// 			}
	// 		} catch {
	// 			handleLocalStorageFallback();
	// 		}
	// 	} catch (error) {
	// 		console.error("Error handling visit count:", error);
	// 		handleLocalStorageFallback();
	// 	}
	// }, [handleLocalStorageFallback]);

	// useEffect(() => {
	// 	if (isFirstRender.current) {
	// 		isFirstRender.current = false;
	// 		incrementGlobalVisitCount();
	// 	}
	// }, [incrementGlobalVisitCount]);

	// const formatVisitCount = (count) => {
	// 	if (count >= 1000000) {
	// 		return (count / 1000000).toFixed(1) + "M";
	// 	} else if (count >= 1000) {
	// 		return (count / 1000).toFixed(1) + "K";
	// 	}
	// 	return count.toString();
	// };
	// Statcounter JS tracker (optional, for analytics)

	//no use
	// useEffect(() => {
	// 	const script = document.createElement("script");
	// 	script.type = "text/javascript";
	// 	script.src = "https://statcounter.com/counter/counter.js";
	// 	script.async = true;
	// 	window.sc_project = 13154765;
	// 	window.sc_invisible = 0;
	// 	window.sc_security = "9b97543e";
	// 	document.body.appendChild(script);
	// 	return () => {
	// 		document.body.removeChild(script);
	// 	};
	// }, []);

	return (
		<footer className={styles.footer}>
			<div className={styles.container}>
				<div className={styles.content}>
					<div className={styles.brand}>
						<h3 className={styles.brandName}>College Notes</h3>
						<p className={styles.tagline}>Your Academic Resource Hub</p>
					</div>

					<div className={styles.links}>
						<a href="/" className={styles.link}>
							Home
						</a>
						<a href="/books" className={styles.link}>
							Books
						</a>
						<a href="/about" className={styles.link}>
							About
						</a>
						<a href="/contact" className={styles.link}>
							Contact
						</a>
						<a
							href="https://www.linkedin.com/in/satishshekhar/"
							target="_blank"
							rel="noopener noreferrer"
							className={`${styles.link} ${styles.developer}`}
						>
							Developer: Satish Kumar
						</a>
					</div>
				</div>

				<div className={styles.bottom}>
					<p className={styles.copyright}>
						© 2021-2024 College Notes. All rights reserved.
					</p>
					<div className={styles.credits}>
						<span>Built with ❤️ for students</span>
						{/* <div className={styles.visitCounter}>
							<span className={styles.visitIcon}>eye_symbol</span>
							<span className={styles.visitText}>
								{formatVisitCount(visitCount)} visits
								
							</span>
						</div> */}
					</div>
				</div>
			</div>
		</footer>
	);
}

export default SimpleFooter;
