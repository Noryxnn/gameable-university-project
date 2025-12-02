import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/users/auth/google/callback",
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
        });

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

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

