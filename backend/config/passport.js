import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

// Load environment variables (in case this module is imported before dotenv.config() in server.js)
dotenv.config();

// Flag to track if Google OAuth is enabled
let googleOAuthEnabled = false;

// Debug: Check if environment variables are loaded
const hasClientID = !!process.env.GOOGLE_CLIENT_ID;
const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

// Only initialize Google OAuth strategy if credentials are configured
if (hasClientID && hasClientSecret) {
  googleOAuthEnabled = true;
  console.log("✅ Google OAuth enabled successfully");
  // Ensure callback URL is absolute
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    `${process.env.BACKEND_URL || "http://localhost:5050"}/api/users/auth/google/callback`;
  
  console.log(`🔗 Google OAuth Callback URL: ${callbackURL}`);
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with this email (account linking scenario)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User exists with email but no Google ID - link the account
          user.googleId = profile.id;
          user.authProvider = "google";
          // If user doesn't have a username, use Google display name
          if (!user.username) {
            user.username = profile.displayName || profile.emails[0].value.split("@")[0];
          }
          await user.save();
          return done(null, user);
        }

        // New user - create account
        // Generate username from email if displayName is not available
        const username = profile.displayName || profile.emails[0].value.split("@")[0];
        
        // Ensure username is unique
        let uniqueUsername = username;
        let counter = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${username}${counter}`;
          counter++;
        }

        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: uniqueUsername,
          authProvider: "google",
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
          newsletterOptIn: false, // Default to false for Google OAuth signups
          newsletterOptInUpdatedAt: null,
        });

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
    )
  );
} else {
  console.warn("⚠️  Google OAuth credentials not configured. Google login will be disabled.");
  console.warn("   To enable, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file");
  console.warn(`   GOOGLE_CLIENT_ID: ${hasClientID ? "✅ Set" : "❌ Missing"}`);
  console.warn(`   GOOGLE_CLIENT_SECRET: ${hasClientSecret ? "✅ Set" : "❌ Missing"}`);
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
export { googleOAuthEnabled };

