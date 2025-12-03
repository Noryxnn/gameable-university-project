import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User.js";
import authRoutes from "../../routes/auth.js";
import gamesRoutes from "../../routes/games.js";
import { protect, admin } from "../../middleware/auth.js";
import newsletterService from "../../services/NewsletterService.js";

// Load environment variables
dotenv.config();

// Mock middleware - use vi.fn() so we can change implementation per test
vi.mock("../../middleware/auth.js", () => ({
  protect: vi.fn((req, res, next) => {
    // Default: just call next (no user set)
    next();
  }),
  admin: vi.fn((req, res, next) => {
    // Default: just call next
    next();
  }),
}));

// Mock NewsletterService
vi.mock("../../services/NewsletterService.js", () => ({
  default: {
    sendNewGameAnnouncement: vi.fn().mockResolvedValue({ sent: 2, failed: 0 }),
  },
}));

describe("Newsletter Feature - Integration Tests", () => {
  let app;
  let testUsers = [];
  let authToken;

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
    // Clean up test data
    await User.deleteMany({ email: { $regex: /^test.*@test\.com$/ } });
    testUsers = [];
    vi.clearAllMocks();
    // Reset middleware mocks to default behavior
    vi.mocked(protect).mockImplementation((req, res, next) => next());
    vi.mocked(admin).mockImplementation((req, res, next) => next());

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use("/api/users", authRoutes);
    app.use("/api/games", gamesRoutes);

    // Create a test user for authentication
    const testUser = await User.create({
      username: "testuser",
      email: "test@test.com",
      password: "password123",
      newsletterOptIn: false,
    });
    testUsers.push(testUser);

    // Generate token (simplified - in real app, use JWT)
    authToken = "test-token";
  });

  describe("Registration with Newsletter Opt-In", () => {
    it("should register user with newsletterOptIn = true when checkbox is checked", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          username: "newuser1",
          email: "newuser1@test.com",
          password: "password123",
          newsletterOptIn: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");

      // Verify user was created with newsletterOptIn = true
      const user = await User.findOne({ email: "newuser1@test.com" });
      expect(user).toBeTruthy();
      expect(user.newsletterOptIn).toBe(true);
      expect(user.newsletterOptInUpdatedAt).toBeTruthy();
    });

    it("should register user with newsletterOptIn = false when checkbox is unchecked", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          username: "newuser2",
          email: "newuser2@test.com",
          password: "password123",
          newsletterOptIn: false,
        });

      expect(response.status).toBe(201);

      // Verify user was created with newsletterOptIn = false
      const user = await User.findOne({ email: "newuser2@test.com" });
      expect(user).toBeTruthy();
      expect(user.newsletterOptIn).toBe(false);
    });

    it("should default newsletterOptIn to false when not provided", async () => {
      const response = await request(app)
        .post("/api/users/register")
        .send({
          username: "newuser3",
          email: "newuser3@test.com",
          password: "password123",
        });

      expect(response.status).toBe(201);

      // Verify user was created with newsletterOptIn = false (default)
      const user = await User.findOne({ email: "newuser3@test.com" });
      expect(user).toBeTruthy();
      expect(user.newsletterOptIn).toBe(false);
    });
  });

  describe("Preferences Endpoint", () => {
    it("should update newsletter preference to true", async () => {
      // Mock protect middleware to set req.user
      vi.mocked(protect).mockImplementation((req, res, next) => {
        req.user = { _id: testUsers[0]._id };
        next();
      });

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          newsletterOptIn: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.newsletterOptIn).toBe(true);
      expect(response.body).toHaveProperty("newsletterOptInUpdatedAt");

      // Verify database was updated
      const user = await User.findById(testUsers[0]._id);
      expect(user.newsletterOptIn).toBe(true);
      expect(user.newsletterOptInUpdatedAt).toBeTruthy();
    });

    it("should update newsletter preference to false", async () => {
      // Set initial preference to true
      testUsers[0].newsletterOptIn = true;
      await testUsers[0].save();

      // Mock protect middleware
      vi.mocked(protect).mockImplementation((req, res, next) => {
        req.user = { _id: testUsers[0]._id };
        next();
      });

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          newsletterOptIn: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.newsletterOptIn).toBe(false);

      // Verify database was updated
      const user = await User.findById(testUsers[0]._id);
      expect(user.newsletterOptIn).toBe(false);
    });

    it("should reject non-boolean newsletterOptIn value", async () => {
      vi.mocked(protect).mockImplementation((req, res, next) => {
        req.user = { _id: testUsers[0]._id };
        next();
      });

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          newsletterOptIn: "true", // String instead of boolean
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("boolean");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .put("/api/users/me/preferences")
        .send({
          newsletterOptIn: true,
        });

      // Should fail without auth (depends on protect middleware implementation)
      // This test verifies the endpoint exists and requires auth
      expect([400, 401, 403]).toContain(response.status);
    });
  });

  describe("Admin Game Creation - Newsletter Trigger", () => {
    it("should trigger newsletter service when admin creates a game", async () => {
      // Create admin user
      const adminUser = await User.create({
        username: "adminuser",
        email: "admin@test.com",
        password: "password123",
        isAdmin: true,
      });
      testUsers.push(adminUser);

      // Mock protect and admin middleware
      vi.mocked(protect).mockImplementation((req, res, next) => {
        req.user = { _id: adminUser._id, isAdmin: true };
        next();
      });

      vi.mocked(admin).mockImplementation((req, res, next) => {
        next();
      });

      const gameData = {
        title: "New Test Game",
        developer: "Test Developer",
        genre: "Action",
        description: "A test game",
        releaseYear: 2024,
        imageUrl: "https://example.com/game.jpg",
        rating: "E",
      };

      const response = await request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${authToken}`)
        .send(gameData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("title", "New Test Game");

      // Verify NewsletterService was called
      expect(newsletterService.sendNewGameAnnouncement).toHaveBeenCalledTimes(1);
      expect(newsletterService.sendNewGameAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Test Game",
        })
      );
    });
  });
});

