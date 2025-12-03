import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import User from "../../models/User.js";
import authRoutes from "../../routes/auth.js";

vi.mock("../../models/User.js");
vi.mock("../../middleware/auth.js", () => ({
  protect: (req, res, next) => {
    req.user = {
      _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      username: "testuser",
      email: "test@example.com"
    };
    next();
  },
  admin: (req, res, next) => next(),
  mainAdmin: (req, res, next) => next()
}));

describe("Newsletter Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/users", authRoutes);
    vi.clearAllMocks();
  });

  describe("PUT /api/users/me/preferences", () => {
    it("should update newsletter preference to true", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        username: "testuser",
        email: "test@example.com",
        newsletterOptIn: false,
        save: vi.fn().mockResolvedValue(true)
      };

      User.findById = vi.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", "Bearer fake-token")
        .send({ newsletterOptIn: true });

      expect(response.status).toBe(200);
      expect(response.body.newsletterOptIn).toBe(true);
      expect(mockUser.newsletterOptIn).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should update newsletter preference to false", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        username: "testuser",
        email: "test@example.com",
        newsletterOptIn: true,
        save: vi.fn().mockResolvedValue(true)
      };

      User.findById = vi.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", "Bearer fake-token")
        .send({ newsletterOptIn: false });

      expect(response.status).toBe(200);
      expect(response.body.newsletterOptIn).toBe(false);
      expect(mockUser.newsletterOptIn).toBe(false);
    });

    it("should return 400 when newsletterOptIn is not a boolean", async () => {
      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", "Bearer fake-token")
        .send({ newsletterOptIn: "true" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("boolean");
    });

    it("should return 404 when user is not found", async () => {
      User.findById = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", "Bearer fake-token")
        .send({ newsletterOptIn: true });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("not found");
    });

    it("should set newsletterOptInUpdatedAt when updating preference", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        username: "testuser",
        email: "test@example.com",
        newsletterOptIn: false,
        newsletterOptInUpdatedAt: null,
        save: vi.fn().mockResolvedValue(true)
      };

      User.findById = vi.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put("/api/users/me/preferences")
        .set("Authorization", "Bearer fake-token")
        .send({ newsletterOptIn: true });

      expect(response.status).toBe(200);
      expect(mockUser.newsletterOptInUpdatedAt).toBeInstanceOf(Date);
    });
  });
});

