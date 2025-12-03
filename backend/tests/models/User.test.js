import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import User from "../../models/User.js";

describe("User Model - Google OAuth Support", () => {
  beforeAll(async () => {
    // Connect to test database if needed
    // In a real scenario, you'd use a test database
  });

  afterAll(async () => {
    // Clean up test database connection
  });

  describe("OAuth Fields", () => {
    it("should allow creating user with googleId and authProvider", async () => {
      const userData = {
        username: "googleuser",
        email: "google@example.com",
        googleId: "google-123456",
        authProvider: "google",
        // password is optional for OAuth users
      };

      const user = new User(userData);
      
      expect(user.googleId).toBe("google-123456");
      expect(user.authProvider).toBe("google");
      expect(user.username).toBe("googleuser");
      expect(user.email).toBe("google@example.com");
    });

    it("should allow creating user without password for OAuth users", async () => {
      const userData = {
        username: "oauthuser",
        email: "oauth@example.com",
        googleId: "google-789012",
        authProvider: "google",
      };

      const user = new User(userData);
      
      // Password should be undefined or empty for OAuth users
      expect(user.password).toBeUndefined();
    });

    it("should allow creating user with password for local auth", async () => {
      const userData = {
        username: "localuser",
        email: "local@example.com",
        password: "password123",
        authProvider: "local",
      };

      const user = new User(userData);
      
      expect(user.password).toBeDefined();
      expect(user.authProvider).toBe("local");
    });

    it("should default authProvider to 'local' when not specified", async () => {
      const userData = {
        username: "defaultuser",
        email: "default@example.com",
        password: "password123",
      };

      const user = new User(userData);
      
      expect(user.authProvider).toBe("local");
    });
  });

  describe("Account Linking", () => {
    it("should support linking Google account to existing email user", async () => {
      const userData = {
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
        authProvider: "local",
      };

      const user = new User(userData);
      
      // Simulate account linking
      user.googleId = "google-linked-123";
      user.authProvider = "google";
      
      expect(user.googleId).toBe("google-linked-123");
      expect(user.authProvider).toBe("google");
      expect(user.email).toBe("existing@example.com");
    });
  });
});

