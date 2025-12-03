import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../../models/User.js";
import newsletterService from "../../../services/NewsletterService.js";

// Load env variables
dotenv.config();

// Create mock functions
const mockSend = vi.fn();
const mockIsConfigured = vi.fn(() => true);

// Mock EmailService BEFORE import
vi.mock("../../../services/EmailService.js", () => {
  return {
    default: {
      send: mockSend,
      isConfigured: mockIsConfigured,
    },
  };
});

// Import after mocking
import emailService from "../../../services/EmailService.js";

describe("NewsletterService", () => {
  beforeAll(async () => {
    const testDbUri = process.env.TEST_MONGO_URI || process.env.MONGO_URI;

    if (!testDbUri) {
      throw new Error("TEST_MONGO_URI or MONGO_URI must be set for tests.");
    }

    try {
      await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 10000 });
      console.log("✅ Connected to test database");
    } catch (err) {
      console.error("❌ Database connection failed:", err.message);
      throw err;
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    console.log("✅ Closed test database");
  });

  beforeEach(async () => {
    // CLEAN ALL USERS — prevents interference from other test files
    await User.deleteMany({});

    vi.clearAllMocks();

    // Default behavior
    mockSend.mockResolvedValue(undefined);
    mockIsConfigured.mockReturnValue(true);
  });

  // -------------------------------------------------------
  // sendNewGameAnnouncement
  // -------------------------------------------------------

  describe("sendNewGameAnnouncement", () => {
    it("should send emails to all opted-in users", async () => {
      // Create users
      const u1 = await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "password",
        newsletterOptIn: true,
      });

      const u2 = await User.create({
        username: "testuser2",
        email: "test2@test.com",
        password: "password",
        newsletterOptIn: true,
      });

      await User.create({
        username: "testuser3",
        email: "test3@test.com",
        password: "password",
        newsletterOptIn: false,
      });

      const game = { _id: "507f1f77bcf86cd799439011", title: "Test Game" };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);

      expect(mockSend).toHaveBeenCalledTimes(2);

      const call1 = mockSend.mock.calls[0][0];
      const call2 = mockSend.mock.calls[1][0];

      expect(call1.to).toBe("test1@test.com");
      expect(call1.subject).toBe("New game added: Test Game");
      expect(call1.html).toContain("testuser1");
      expect(call1.html).toContain("Test Game");
      expect(call1.html).toContain("Check It Out");
      expect(call1.html).toContain("GameAble Team");

      expect(call2.to).toBe("test2@test.com");
      expect(call2.subject).toBe("New game added: Test Game");
      expect(call2.html).toContain("testuser2");
      expect(call2.html).toContain("Test Game");
    });

    it("should not send emails when no users opted in", async () => {
      await User.create({
        username: "u1",
        email: "u1@test.com",
        password: "pw",
        newsletterOptIn: false,
      });

      const result = await newsletterService.sendNewGameAnnouncement({
        title: "Test Game",
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("should handle email sending failures", async () => {
      // fail first send, succeed second
      mockSend
        .mockRejectedValueOnce(new Error("Email failed"))
        .mockResolvedValueOnce(undefined);

      await User.create({
        username: "u1",
        email: "u1@test.com",
        password: "pw",
        newsletterOptIn: true,
      });

      await User.create({
        username: "u2",
        email: "u2@test.com",
        password: "pw",
        newsletterOptIn: true,
      });

      const result = await newsletterService.sendNewGameAnnouncement({
        title: "Test Game",
      });

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("should include correct HTML content", async () => {
      await User.create({
        username: "testuser1",
        email: "test1@test.com",
        password: "pw",
        newsletterOptIn: true,
      });

      const game = { _id: "507f1f77bcf86cd799439011", title: "Amazing Game Title" };

      await newsletterService.sendNewGameAnnouncement(game);

      const call = mockSend.mock.calls[0][0];

      expect(call.subject).toBe("New game added: Amazing Game Title");
      expect(call.html).toContain("Amazing Game Title");
      expect(call.html).toContain("Check It Out");
      expect(call.html).toContain("GameAble Team");
      expect(call.html).toContain("testuser1");
    });

    it("should throw error if game object is invalid", async () => {
      await expect(newsletterService.sendNewGameAnnouncement(null)).rejects.toThrow(
        "Game object with title is required"
      );

      await expect(
        newsletterService.sendNewGameAnnouncement({})
      ).rejects.toThrow("Game object with title is required");
    });

    it("should return {sent:0, failed:0} if email service not configured", async () => {
      mockIsConfigured.mockReturnValueOnce(false);

      await User.create({
        username: "u1",
        email: "u1@test.com",
        password: "pw",
        newsletterOptIn: true,
      });

      const result = await newsletterService.sendNewGameAnnouncement({
        title: "Test Game",
      });

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // getOptedInCount
  // -------------------------------------------------------

  describe("getOptedInCount", () => {
    it("should return correct count", async () => {
      await User.create({
        username: "a",
        email: "a@test.com",
        password: "pw",
        newsletterOptIn: true,
      });

      await User.create({
        username: "b",
        email: "b@test.com",
        password: "pw",
        newsletterOptIn: true,
      });

      await User.create({
        username: "c",
        email: "c@test.com",
        password: "pw",
        newsletterOptIn: false,
      });

      const count = await newsletterService.getOptedInCount();
      expect(count).toBe(2);
    });

    it("should return 0 when nobody opted in", async () => {
      await User.create({
        username: "x",
        email: "x@test.com",
        password: "pw",
        newsletterOptIn: false,
      });

      const count = await newsletterService.getOptedInCount();
      expect(count).toBe(0);
    });
  });
});