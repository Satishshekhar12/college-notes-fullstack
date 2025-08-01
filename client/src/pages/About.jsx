import React from "react";

const About = () => {
	return (
		<div className="min-h-[calc(100vh-200px)] mt-12 py-10 px-5 bg-gradient-to-br from-slate-50 to-slate-200 flex justify-center items-start">
			<div className="max-w-4xl w-full bg-white/95 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 overflow-hidden">
				<div
					className="text-center py-10 px-10 text-white"
					style={{ backgroundColor: "#11999e" }}
				>
					<h1 className="text-4xl md:text-3xl font-bold m-0 tracking-tight">
						About College Notes
					</h1>
					<div className="h-1 w-20 bg-white/80 mx-auto mt-5 rounded-sm"></div>
				</div>

				<div className="p-10">
					<div className="mb-8">
						<h2 className="text-xl fo</div>nt-semibold text-gray-800 mb-3 flex items-center gap-2">
							🎓 Our Story
						</h2>
						<p className="text-lg leading-relaxed text-gray-700 m-0">
							This project was started in <strong>2022</strong> by{" "}
							<strong>Satish Shekhar</strong> during his B.Sc. Mathematics at{" "}
							<strong>Banaras Hindu University (BHU)</strong>.
						</p>
					</div>

					<div className="mb-8">
						<h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
							🦠 Born from Necessity
						</h2>
						<p className="text-lg leading-relaxed text-gray-700 m-0">
							It began during the <strong>COVID-19 pandemic</strong>, when
							online classes made accessing quality notes and study materials
							incredibly difficult for students. What started as a simple
							solution to help peers has evolved into something much bigger.
						</p>
					</div>

					<div className="mb-8">
						<h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
							🚀 Evolution
						</h2>
						<p className="text-lg leading-relaxed text-gray-700 m-0">
							Initially built with{" "}
							<strong>HTML, CSS, Bootstrap and JavaScript</strong> to help
							fellow students, the{" "}
							<a
								href="https://college-notes.github.io/cv/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-colors duration-200 font-semibold"
							>
								Initial website
							</a>{" "}
							served <strong>5000+ visits</strong>. Now, it's being rebuilt in{" "}
							<strong>React</strong> to better support students across various
							courses including <strong>Colleges</strong> and more.
						</p>
					</div>

					<div className="mb-8">
						<h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
							📚 What We Offer
						</h2>
						<p className="text-lg leading-relaxed text-gray-700 m-0">
							The site provides easy access to{" "}
							<strong>Notes, Previous Year Questions (PYQs), and Books</strong>,
							all organized by subject and semester to make your academic
							journey smoother and more efficient.
						</p>
					</div>

					<div className="mb-8">
						<h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
							🤝 Collaborative Effort
						</h2>
						<p className="text-lg leading-relaxed text-gray-700 m-0">
							This is a <strong>collaborative effort</strong> — we believe in
							the power of community. Your contributions, suggestions, and
							feedback are not just welcome, they're essential to making this
							platform better for everyone.
						</p>
					</div>

					<div className="text-center mt-10 p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border border-orange-200">
						<p className="text-xl font-semibold text-gray-800 m-0">
							Together, let's make quality education accessible to all! 🌟
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default About;
