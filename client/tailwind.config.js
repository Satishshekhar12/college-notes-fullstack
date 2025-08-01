/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
			},
			animation: {
				gradient: "gradient 15s ease infinite",
			},
			keyframes: {
				gradient: {
					"0%, 100%": {
						"background-position": "0% 50%",
					},
					"25%": {
						"background-position": "100% 0%",
					},
					"50%": {
						"background-position": "100% 100%",
					},
					"75%": {
						"background-position": "0% 100%",
					},
				},
			},
		},
	},
	plugins: [],
};
