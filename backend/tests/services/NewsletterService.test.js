import { describe, it, expect, vi, beforeEach } from "vitest";
import newsletterService from "../../services/NewsletterService.js";
import User from "../../models/User.js";
import emailService from "../../services/EmailService.js";

vi.mock("../../models/User.js");
vi.mock("../../services/EmailService.js");

describe("NewsletterService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateNewsletterTemplate", () => {
    it("should generate HTML template with user name and game title", () => {
      const userName = "John";
      const gameTitle = "Test Game";
      const gameLink = "http://localhost:5173/game/123";

      const template = newsletterService.generateNewsletterTemplate(userName, gameTitle, gameLink);

      expect(template).toContain("John");
      expect(template).toContain("Test Game");
      expect(template).toContain("http://localhost:5173/game/123");
      expect(template).toContain("<!DOCTYPE html>");
    });

    it("should use default name when userName is not provided", () => {
      const gameTitle = "Another Game";
      const gameLink = "http://localhost:5173/game/456";

      const template = newsletterService.generateNewsletterTemplate(null, gameTitle, gameLink);

      expect(template).toContain("there");
      expect(template).toContain("Another Game");
    });
  });

  describe("sendNewGameAnnouncement", () => {
    it("should throw error when game is missing", async () => {
      await expect(newsletterService.sendNewGameAnnouncement(null)).rejects.toThrow(
        "Game object with title is required"
      );
    });

    it("should return zero counts when email service is not configured", async () => {
      emailService.isConfigured = vi.fn().mockReturnValue(false);

      const game = {
        _id: "game123",
        title: "Test Game"
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result).toEqual({ sent: 0, failed: 0 });
    });

    it("should return zero counts when no users have opted in", async () => {
      emailService.isConfigured = vi.fn().mockReturnValue(true);
      User.find = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue([])
      });

      const game = {
        _id: "game123",
        title: "Test Game"
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result).toEqual({ sent: 0, failed: 0 });
    });

    it("should send emails to opted-in users", async () => {
      emailService.isConfigured = vi.fn().mockReturnValue(true);
      emailService.send = vi.fn().mockResolvedValue();

      const mockUsers = [
        { email: "user1@test.com", username: "user1" },
        { email: "user2@test.com", username: "user2" }
      ];

      User.find = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUsers)
      });

      const game = {
        _id: "game123",
        title: "Test Game"
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(emailService.send).toHaveBeenCalledTimes(2);
    });

    it("should handle email sending failures", async () => {
      emailService.isConfigured = vi.fn().mockReturnValue(true);
      emailService.send = vi.fn()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error("Email failed"));

      const mockUsers = [
        { email: "user1@test.com", username: "user1" },
        { email: "user2@test.com", username: "user2" }
      ];

      User.find = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUsers)
      });

      const game = {
        _id: "game123",
        title: "Test Game"
      };

      const result = await newsletterService.sendNewGameAnnouncement(game);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe("getOptedInCount", () => {
    it("should return count of opted-in users", async () => {
      User.countDocuments = vi.fn().mockResolvedValue(5);

      const count = await newsletterService.getOptedInCount();

      expect(count).toBe(5);
      expect(User.countDocuments).toHaveBeenCalledWith({ newsletterOptIn: true });
    });

    it("should return zero when no users have opted in", async () => {
      User.countDocuments = vi.fn().mockResolvedValue(0);

      const count = await newsletterService.getOptedInCount();

      expect(count).toBe(0);
    });
  });
});
