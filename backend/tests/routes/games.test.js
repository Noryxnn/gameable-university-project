import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Game from "../../models/Game.js";
import gamesRoutes from "../../routes/games.js";

// Load environment variables
dotenv.config();

describe("Games Routes - Filter Integration Tests", () => {
  let app;
  let testGames = [];

  // Test games data
  const testGamesData = [
    {
      title: "GTA V",
      developer: "Rockstar Games",
      genre: "Action-Adventure",
      description: "An open-world action-adventure game.",
      releaseYear: 2013,
      imageUrl: "https://example.com/gta5.jpg",
      rating: "M",
      accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
    },
    {
      title: "Cyberpunk 2077",
      developer: "CD Projekt Red",
      genre: "Action RPG",
      description: "An open-world, action-adventure RPG.",
      releaseYear: 2020,
      imageUrl: "https://example.com/cyberpunk.jpg",
      rating: "M",
      accessibilityFeatures: [], // Empty array
    },
    {
      title: "God of War (2018)",
      developer: "Santa Monica Studio",
      genre: "Action-Adventure",
      description: "An action-adventure game set in Norse mythology.",
      releaseYear: 2018,
      imageUrl: "https://example.com/gow.jpg",
      rating: "M",
      accessibilityFeatures: [
        "Full Captions",
        "Large Target Inputs",
        "Colorblind Mode",
        "Screen Reader",
        "Subtitles",
        "One-Handed Mode",
      ],
    },
    {
      title: "Red Dead Redemption 2",
      developer: "Rockstar Games",
      genre: "Action-Adventure",
      description: "An open-world Western action-adventure game.",
      releaseYear: 2018,
      imageUrl: "https://example.com/rdr2.jpg",
      rating: "M",
      accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
    },
  ];

  beforeAll(async () => {
    // Connect to test database
    // Use a test database URI if provided, otherwise use the main database
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

    // Set up Express app for testing
    app = express();
    app.use(express.json());
    app.use("/api/games", gamesRoutes);
  });

  afterAll(async () => {
    // Clean up: Delete all test games
    try {
      await Game.deleteMany({
        title: { $in: testGamesData.map((g) => g.title) },
      });
      console.log("✅ Cleaned up test games");
    } catch (error) {
      console.error("⚠️ Error cleaning up test games:", error.message);
    }

    // Close database connection
    try {
      await mongoose.connection.close();
      console.log("✅ Closed database connection");
    } catch (error) {
      console.error("⚠️ Error closing database connection:", error.message);
    }
  });

  beforeEach(async () => {
    // Clean up existing test games before each test to ensure isolation
    await Game.deleteMany({
      title: { $in: testGamesData.map((g) => g.title) },
    });

    // Insert test games
    testGames = await Game.insertMany(testGamesData);
    expect(testGames).toHaveLength(testGamesData.length);
  });

  describe("GET /api/games - No filters", () => {
    it("should return all games when no query params are provided", async () => {
      const response = await request(app).get("/api/games");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(testGamesData.length);

      // Check that all test games are included
      const responseTitles = response.body.map((game) => game.title);
      testGamesData.forEach((testGame) => {
        expect(responseTitles).toContain(testGame.title);
      });
    });
  });

  describe("GET /api/games - Genre filter (OR logic)", () => {
    it("should return only Action-Adventure games when genre filter is applied", async () => {
      const response = await request(app).get("/api/games?genres=Action-Adventure");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Should include: GTA V, God of War, Red Dead Redemption 2
      // Should NOT include: Cyberpunk 2077
      const responseTitles = response.body.map((game) => game.title);

      expect(responseTitles).toContain("GTA V");
      expect(responseTitles).toContain("God of War (2018)");
      expect(responseTitles).toContain("Red Dead Redemption 2");
      expect(responseTitles).not.toContain("Cyberpunk 2077");

      // Verify all returned games are Action-Adventure
      response.body.forEach((game) => {
        expect(game.genre).toBe("Action-Adventure");
      });
    });

    it("should return Action RPG games when genre filter is Action RPG", async () => {
      const response = await request(app).get("/api/games?genres=Action RPG");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);
      expect(responseTitles).toContain("Cyberpunk 2077");

      // Should not include Action-Adventure games
      expect(responseTitles).not.toContain("GTA V");
      expect(responseTitles).not.toContain("God of War (2018)");
      expect(responseTitles).not.toContain("Red Dead Redemption 2");
    });

    it("should return games matching any of multiple genres (OR logic)", async () => {
      const response = await request(app).get(
        "/api/games?genres=Action-Adventure,Action RPG"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);

      // Should include all test games
      expect(responseTitles).toContain("GTA V");
      expect(responseTitles).toContain("Cyberpunk 2077");
      expect(responseTitles).toContain("God of War (2018)");
      expect(responseTitles).toContain("Red Dead Redemption 2");

      // Verify all games are either Action-Adventure or Action RPG
      response.body.forEach((game) => {
        expect(["Action-Adventure", "Action RPG"]).toContain(game.genre);
      });
    });
  });

  describe("GET /api/games - Accessibility filter (AND logic)", () => {
    it("should return games with Colorblind Mode and Subtitles (both features required)", async () => {
      const response = await request(app).get(
        "/api/games?accessibility=Colorblind Mode,Subtitles"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);

      // Should include games that have BOTH features
      expect(responseTitles).toContain("GTA V");
      expect(responseTitles).toContain("God of War (2018)");
      expect(responseTitles).toContain("Red Dead Redemption 2");

      // Should NOT include Cyberpunk 2077 (empty accessibilityFeatures)
      expect(responseTitles).not.toContain("Cyberpunk 2077");

      // Verify all returned games have both features
      response.body.forEach((game) => {
        const features = game.accessibilityFeatures || [];
        expect(features).toContain("Colorblind Mode");
        expect(features).toContain("Subtitles");
      });
    });

    it("should return empty array when no games match accessibility filter", async () => {
      const response = await request(app).get(
        "/api/games?accessibility=SomeFeatureThatDoesNotExist"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it("should return games with single accessibility feature", async () => {
      const response = await request(app).get(
        "/api/games?accessibility=Screen Reader"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);

      // Only God of War has Screen Reader
      expect(responseTitles).toContain("God of War (2018)");
    });
  });

  describe("GET /api/games - Combined genre and accessibility filters", () => {
    it("should return Action RPG games with Subtitles feature", async () => {
      // First, add a game that is Action RPG with Subtitles
      const testGameWithSubtitles = await Game.create({
        title: "Test Action RPG with Subtitles",
        developer: "Test Dev",
        genre: "Action RPG",
        description: "Test game",
        releaseYear: 2020,
        imageUrl: "https://example.com/test.jpg",
        rating: "T",
        accessibilityFeatures: ["Subtitles"],
      });

      const response = await request(app).get(
        "/api/games?genres=Action RPG&accessibility=Subtitles"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);

      // Should include the test game
      expect(responseTitles).toContain("Test Action RPG with Subtitles");

      // Should NOT include Cyberpunk 2077 (Action RPG but no Subtitles)
      expect(responseTitles).not.toContain("Cyberpunk 2077");

      // Verify all returned games are Action RPG and have Subtitles
      response.body.forEach((game) => {
        expect(game.genre).toBe("Action RPG");
        const features = game.accessibilityFeatures || [];
        expect(features).toContain("Subtitles");
      });

      // Clean up test game
      await Game.findByIdAndDelete(testGameWithSubtitles._id);
    });

    it("should return Action-Adventure games with Colorblind Mode and Subtitles", async () => {
      const response = await request(app).get(
        "/api/games?genres=Action-Adventure&accessibility=Colorblind Mode,Subtitles"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);

      // Should include Action-Adventure games with both features
      expect(responseTitles).toContain("GTA V");
      expect(responseTitles).toContain("God of War (2018)");
      expect(responseTitles).toContain("Red Dead Redemption 2");

      // Should NOT include Cyberpunk 2077 (wrong genre)
      expect(responseTitles).not.toContain("Cyberpunk 2077");

      // Verify all returned games match both criteria
      response.body.forEach((game) => {
        expect(game.genre).toBe("Action-Adventure");
        const features = game.accessibilityFeatures || [];
        expect(features).toContain("Colorblind Mode");
        expect(features).toContain("Subtitles");
      });
    });
  });

  describe("GET /api/games - Edge cases", () => {
    it("should handle empty genre filter gracefully", async () => {
      const response = await request(app).get("/api/games?genres=");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should return all games (no genre filter applied)
    });

    it("should handle empty accessibility filter gracefully", async () => {
      const response = await request(app).get("/api/games?accessibility=");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should return all games (no accessibility filter applied)
    });

    it("should handle genre filter with spaces correctly", async () => {
      const response = await request(app).get("/api/games?genres=Action RPG");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);
      expect(responseTitles).toContain("Cyberpunk 2077");
    });

    it("should handle accessibility filter with spaces in feature names", async () => {
      const response = await request(app).get(
        "/api/games?accessibility=Colorblind Mode"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const responseTitles = response.body.map((game) => game.title);
      expect(responseTitles).toContain("GTA V");
      expect(responseTitles).toContain("God of War (2018)");
      expect(responseTitles).toContain("Red Dead Redemption 2");
    });
  });
});

