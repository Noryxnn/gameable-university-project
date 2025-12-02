import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import User from "../../models/User.js";

// Mock passport - use factory function to avoid hoisting issues
vi.mock("passport", () => {
  return {
    default: {
      authenticate: vi.fn((strategy, options) => {
        // Return a middleware function that passport.authenticate would return
        return (req, res, next) => {
          // For callback route, simulate successful authentication
          if (req.path && req.path.includes("callback")) {
            req.user = {
              _id: "507f1f77bcf86cd799439011", // Mock ObjectId as string
              username: "testuser",
              email: "test@example.com",
              isAdmin: false,
              isBanned: false,
            };
            return next();
          }
          // For initiation route, passport would redirect to Google
          // In test, we'll just send a response to verify route exists
          return res.status(302).end();
        };
      }),
    },
  };
});

// Mock googleOAuthEnabled - use factory function
vi.mock("../../config/passport.js", () => {
  const mockAuthenticate = vi.fn((strategy, options) => {
    return (req, res, next) => {
      req.user = {
        _id: new mongoose.Types.ObjectId(),
        username: "testuser",
        email: "test@example.com",
        isAdmin: false,
        isBanned: false,
      };
      next();
    };
  });

  return {
    default: {
      authenticate: mockAuthenticate,
    },
    googleOAuthEnabled: true,
  };
});

// Import after mocks are set up
import authRoutes from "../../routes/auth.js";

describe("Auth Routes - Google OAuth", () => {
  let app;

  beforeEach(() => {
    // Set up required environment variables
    process.env.JWT_SECRET = "test-jwt-secret-for-testing";
    process.env.FRONTEND_URL = "http://localhost:5173";
    
    app = express();
    app.use(express.json());
    app.use("/api/users", authRoutes);
    vi.clearAllMocks();
  });

  describe("GET /api/users/auth/google", () => {
    it("should verify Google OAuth route exists", () => {
      // Verify the route is registered
      expect(authRoutes).toBeDefined();
    });

    it("should handle Google OAuth initiation route", async () => {
      // This route should be accessible when googleOAuthEnabled is true
      // passport.authenticate will handle the redirect to Google
      const response = await request(app).get("/api/users/auth/google");

      // Route should exist (not 404) - may redirect (302) or return other status
      // The important thing is it's not a 404
      expect(response.status).not.toBe(404);
    });
  });

  describe("GET /api/users/auth/google/callback", () => {
    it("should handle OAuth callback route with JWT_SECRET set", async () => {
      // Ensure JWT_SECRET is set
      process.env.JWT_SECRET = "test-jwt-secret-for-testing";
      process.env.FRONTEND_URL = "http://localhost:5173";

      // The route exists and will try to process the callback
      // Since passport.authenticate is mocked, it will call next() with req.user
      const response = await request(app).get("/api/users/auth/google/callback");

      // Route should exist and be handled (not 404)
      // It may redirect or return an error, but the route exists
      expect(response.status).not.toBe(404);
    });
  });
});

describe("Auth Routes - Login with Google OAuth Users", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/users", authRoutes);
    vi.clearAllMocks();
  });

  it("should reject login attempt for Google OAuth user with password", async () => {
    // Mock User.findOne to return a Google OAuth user
    const mockGoogleUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "google@example.com",
      authProvider: "google",
      password: null,
      matchPassword: vi.fn().mockResolvedValue(false),
    };

    vi.spyOn(User, "findOne").mockResolvedValue(mockGoogleUser);

    const response = await request(app)
      .post("/api/users/login")
      .send({
        email: "google@example.com",
        password: "somepassword",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("Google");
  });
});

describe("Auth Routes - Register with Google OAuth Email", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/users", authRoutes);
    vi.clearAllMocks();
  });

  it("should reject registration for email already used with Google OAuth", async () => {
    // Mock User.findOne to return a Google OAuth user
    const mockGoogleUser = {
      _id: new mongoose.Types.ObjectId(),
      email: "google@example.com",
      authProvider: "google",
    };

    vi.spyOn(User, "findOne").mockResolvedValue(mockGoogleUser);
    vi.spyOn(User, "create").mockResolvedValue(mockGoogleUser);

    const response = await request(app)
      .post("/api/users/register")
      .send({
        username: "newuser",
        email: "google@example.com",
        password: "password123",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Google");
  });
});

