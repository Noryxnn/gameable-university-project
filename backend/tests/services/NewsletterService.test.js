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
    await User.deleteMany({});

    vi.clearAllMocks();

    mockSend.mockResolvedValue(undefined);
    mockIsConfigured.mockReturnValue(true);
  });

  // -------------------------------------------------------
  // sendNewGameAnnouncement
  // -------------------------------------------------------

  describe("sendNewGameAnnouncement", () => {

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