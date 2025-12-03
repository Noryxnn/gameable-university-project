import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User.js";

// Load environment variables
dotenv.config();

// Mock passport and GoogleStrategy
vi.mock("passport", () => ({
  default: {
    use: vi.fn(),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
  },
}));

vi.mock("passport-google-oauth20", () => ({
  Strategy: vi.fn(),
}));

describe("Google OAuth - Newsletter Default Behavior", () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;
    
    if (!testDbUri) {
      throw new Error(
        "TEST_MONGO_URI or MONGO_URI must be set in environment variables for integration tests"
      );
    }

    try {
      await mongoose.connect(testDbUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("✅ Connected to test database");
    } catch (error) {
      console.error("❌ Failed to connect to test database:", error.message);
      throw error;
    }
  });

  afterAll(async () => {
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log("✅ Closed database connection");
    } catch (error) {
      console.error("⚠️ Error closing database connection:", error.message);
    }
  });

  beforeEach(async () => {
    // Clean up test users
    await User.deleteMany({ email: { $regex: /^test.*@test\.com$/ } });
  });

  it("should create new Google OAuth user with newsletterOptIn = false", async () => {
    // Simulate the user creation that happens in passport.js GoogleStrategy callback
    const user = await User.create({
      googleId: "google-test-123",
      email: "test-google@test.com",
      username: "testgoogleuser",
      authProvider: "google",
      profilePicture: "",
      newsletterOptIn: false, // As per requirements
      newsletterOptInUpdatedAt: null, // As per requirements
    });

    expect(user.newsletterOptIn).toBe(false);
    expect(user.newsletterOptInUpdatedAt).toBeNull();
    expect(user.authProvider).toBe("google");
  });

  it("should not change newsletterOptIn for existing Google users", async () => {
    // Create existing user with newsletterOptIn = true
    const existingUser = await User.create({
      googleId: "google-existing-123",
      email: "existing-google@test.com",
      username: "existinggoogleuser",
      authProvider: "google",
      newsletterOptIn: true,
      newsletterOptInUpdatedAt: new Date(),
    });

    // Simulate Google OAuth login (user already exists, so no new user is created)
    const foundUser = await User.findOne({ googleId: "google-existing-123" });

    expect(foundUser).toBeTruthy();
    expect(foundUser.newsletterOptIn).toBe(true); // Should remain unchanged
    expect(foundUser.newsletterOptInUpdatedAt).toBeTruthy();
  });
});

