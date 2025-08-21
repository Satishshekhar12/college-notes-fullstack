import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Get base callback URL and construct both user and admin callbacks
const baseCallbackUrl =
	process.env.GOOGLE_CALLBACK_URL ||
	"http://localhost:5000/api/auth/google/callback";
const userCallbackUrl = baseCallbackUrl;
const adminCallbackUrl = baseCallbackUrl.replace(
	"/callback",
	"/admin/callback"
);

console.log("🔍 User OAuth Callback URL:", userCallbackUrl);
console.log("🔍 Admin OAuth Callback URL:", adminCallbackUrl);
console.log("🔍 Environment:", process.env.NODE_ENV);

// User Google OAuth Strategy
passport.use(
	"google-user",
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: userCallbackUrl,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				console.log(
					"✅ User Google OAuth profile received:",
					profile.displayName,
					profile.emails?.[0]?.value
				);
				const userProfile = {
					googleId: profile.id,
					email: profile.emails?.[0]?.value || null,
					name: profile.displayName,
				};
				return done(null, userProfile);
			} catch (err) {
				console.error("❌ User Google OAuth profile error:", err);
				return done(err);
			}
		}
	)
);

// Admin Google OAuth Strategy
passport.use(
	"google-admin",
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: adminCallbackUrl,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				console.log(
					"✅ Admin Google OAuth profile received:",
					profile.displayName,
					profile.emails?.[0]?.value
				);
				const userProfile = {
					googleId: profile.id,
					email: profile.emails?.[0]?.value || null,
					name: profile.displayName,
				};
				return done(null, userProfile);
			} catch (err) {
				console.error("❌ Admin Google OAuth profile error:", err);
				return done(err);
			}
		}
	)
);

export default passport;
