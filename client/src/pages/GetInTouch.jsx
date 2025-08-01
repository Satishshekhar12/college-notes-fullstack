import React from "react";
import { useNavigate } from "react-router-dom";

function GetInTouch() {
	const navigate = useNavigate();

	return (
		<section className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 py-20 px-5 text-white">
			{/* Background overlay */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-teal-400/10 via-transparent to-transparent"></div>
				<div className="absolute bottom-0 right-0 w-full h-full bg-gradient-radial from-cyan-600/10 via-transparent to-transparent"></div>
			</div>

			<div className="relative z-10 max-w-4xl mx-auto">
				<div className="text-center">
					<h2 className="text-4xl md:text-5xl font-montserrat font-semibold mb-5 text-teal-400">
						Get in Touch-under development
					</h2>
					<p className="text-lg md:text-xl mb-10 opacity-90 leading-relaxed max-w-2xl mx-auto">
						Have questions about our notes or want to contribute? We'd love to
						hear from you!
					</p>

					<div className="flex flex-col gap-5 mb-10">
						<div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white/10 p-5 md:p-6 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
							<span className="text-2xl">📧</span>
							<a
								href="mailto:notes.helper0@gmail.com"
								className="text-lg font-medium hover:text-teal-300 transition-colors"
							>
								notes.helper0@gmail.com
							</a>
						</div>

						<div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white/10 p-5 md:p-6 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/15 hover:-translate-y-1">
							<span className="text-2xl">💬</span>
							<span className="text-lg font-medium text-center md:text-left">
								Connect with us for academic support
							</span>
						</div>
					</div>

					<button
						onClick={() => navigate("/contact")}
						className="inline-flex items-center gap-3 bg-gradient-to-br from-teal-400 to-cyan-600 text-white border-none py-4 px-10 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-xl group"
					>
						Send Message
						<span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
							→
						</span>
					</button>
				</div>
			</div>
		</section>
	);
}

export default GetInTouch;
