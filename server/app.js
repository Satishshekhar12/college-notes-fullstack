import express from "express";
import { corsMiddleware } from "./middleware/cors.js";
import { handleMulterError } from "./middleware/upload.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import bodyParser from "body-parser";
import Settings from "./models/settingsModel.js";
import { applySettingsToS3Config } from "./config/aws.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport.js"; // registers strategies

// Initialize Express app
const app = express();

// Middleware
app.use(corsMiddleware);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Load settings once on startup and watch for changes periodically
(async () => {
	try {
		const doc = await Settings.findOne();
		if (doc) applySettingsToS3Config(doc.toObject());
	} catch (e) {
		console.error("Failed to load settings at startup:", e.message);
	}
})();

// Routes
app.use("/", routes);

// Error handling middleware
app.use(handleMulterError);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
