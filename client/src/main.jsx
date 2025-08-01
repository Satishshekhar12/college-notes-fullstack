import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import "./index.css"; // Importing index.css to apply Tailwind CSS styles globally
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>
);
