import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../../models/User.js";
import newsletterService from "../../../services/NewsletterService.js";
import emailService from "../../../services/EmailService.js";

// Load environment variables
dotenv.config();

// Mock EmailService
vi.mock("../../../services/EmailService.js", () => {
  return {
    default: {
      send: vi.fn(),
      isConfigured: vi.fn(() => true),
    },
  };
});

describe("NewsletterService", () => {
  let testUsers = [];

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
    testUsers = [];
    // Reset mocks to default behavior
    vi.clearAllMocks();
    // Restore default mock implementations
    emailService.send.mockResolvedValue(undefined);
    emailService.isConfigured.mockReturnValue(true);
  });

  describe("sendNewGameAnnouncement", () => {
    it("should send emails to all opted-in users", async () => {
      // Create test users
      const optedInUser1 = await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      const optedInUser2 = await User.create({
        username: "testuser2",
        email: "test2@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      const optedOutUser = await User.create({
        username: "testuser3",
        email: "test3@test.com",
        password: "password123",
        newsletterOptIn: false,
      });

      testUsers = [optedInUser1, optedInUser2, optedOutUser];

      const game = {
        _id: "507f1f77bcf86cd799439011",
        title: "Test Game",
        description: "A test game description",
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      // Should send to 2 opted-in users
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);

      // Verify emailService.send was called twice (for opted-in users only)
      expect(emailService.send).toHaveBeenCalledTimes(2);

      // Verify correct email content
      const firstCall = emailService.send.mock.calls[0][0];
      const secondCall = emailService.send.mock.calls[1][0];

      expect(firstCall.to).toBe("test1@test.com");
      expect(firstCall.subject).toBe("New game added: Test Game");
      expect(firstCall.html).toContain("testuser1");
      expect(firstCall.html).toContain("Test Game");
      expect(firstCall.html).toContain("Check It Out");
      expect(firstCall.html).toContain("GameAble Team");

      expect(secondCall.to).toBe("test2@test.com");
      expect(secondCall.subject).toBe("New game added: Test Game");
      expect(secondCall.html).toContain("testuser2");
      expect(secondCall.html).toContain("Test Game");
    });

    it("should not send emails if no users have opted in", async () => {
      const optedOutUser = await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: false,
      });

      testUsers = [optedOutUser];

      const game = {
        title: "Test Game",
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(emailService.send).not.toHaveBeenCalled();
    });

    it("should handle email sending failures gracefully", async () => {
      // Mock emailService.send to fail for first user
      emailService.send
        .mockRejectedValueOnce(new Error("Email failed"))
        .mockResolvedValueOnce(undefined);

      const optedInUser1 = await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      const optedInUser2 = await User.create({
        username: "testuser2",
        email: "test2@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      testUsers = [optedInUser1, optedInUser2];

      const game = {
        title: "Test Game",
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      // One should succeed, one should fail
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(emailService.send).toHaveBeenCalledTimes(2);
    });

    it("should include game title in email subject and body", async () => {
      const optedInUser = await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      testUsers = [optedInUser];

      const game = {
        _id: "507f1f77bcf86cd799439011",
        title: "Amazing Game Title",
      };

      await newsletterService.sendNewGameAnnouncement(game);

      const callArgs = emailService.send.mock.calls[0][0];
      expect(callArgs.subject).toBe("New game added: Amazing Game Title");
      expect(callArgs.html).toContain("Amazing Game Title");
      expect(callArgs.html).toContain("Check It Out");
      expect(callArgs.html).toContain("GameAble Team");
      expect(callArgs.html).toContain("testuser1");
    });

    it("should throw error if game object is invalid", async () => {
      await expect(newsletterService.sendNewGameAnnouncement(null)).rejects.toThrow(
        "Game object with title is required"
      );

      await expect(newsletterService.sendNewGameAnnouncement({})).rejects.toThrow(
        "Game object with title is required"
      );
    });

    it("should return zero sent/failed if email service is not configured", async () => {
      // Mock emailService to return false for isConfigured
      emailService.isConfigured.mockReturnValueOnce(false);

      const optedInUser = await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      testUsers = [optedInUser];

      const game = {
        title: "Test Game",
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe("getOptedInCount", () => {
    it("should return correct count of opted-in users", async () => {
      await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      await User.create({
        username: "testuser2",
        email: "test2@test.com",
        password: "password123",
        newsletterOptIn: true,
      });

      await User.create({
        username: "testuser3",
        email: "test3@test.com",
        password: "password123",
        newsletterOptIn: false,
      });

      const count = await newsletterService.getOptedInCount();
      expect(count).toBe(2);
    });

    it("should return 0 if no users have opted in", async () => {
      await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password123",
        newsletterOptIn: false,
      });

      const count = await newsletterService.getOptedInCount();
      expect(count).toBe(0);
    });
  });
});

