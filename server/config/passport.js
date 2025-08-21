import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Determine the correct callback URL based on environment
const getCallbackURL = () => {
	if (process.env.NODE_ENV === "production") {
		// Use the production server URL from environment variable
		return process.env.GOOGLE_CALLBACK_URL_PROD || `${process.env.SERVER_URL}/api/auth/google/callback`;
	}
	// Default to development URL
	return process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";
};

// Configure Google OAuth strategy; downstream route will create JWT + cookie
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: getCallbackURL(),
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				console.log(`🔍 Google OAuth Callback URL being used: ${getCallbackURL()}`);
				const userProfile = {
					googleId: profile.id,
					email: profile.emails?.[0]?.value || null,
					name: profile.displayName,
				};
				return done(null, userProfile);
			} catch (err) {
				return done(err);
			}
		}
	)
);

export default passport;
