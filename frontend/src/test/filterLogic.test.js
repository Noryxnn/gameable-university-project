import { describe, it, expect } from "vitest";
import { matchesFilters } from "../utils/gameFilters.js";

describe("Filter Logic - matchesFilters", () => {
  // Test game objects
  const GTA = {
    title: "GTA V",
    genre: "Action-Adventure",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
  };

  const Cyberpunk = {
    title: "Cyberpunk 2077",
    genre: "Action RPG",
    accessibilityFeatures: [],
  };

  const GodOfWar = {
    title: "God of War (2018)",
    genre: "Action-Adventure",
    accessibilityFeatures: [
      "Full Captions",
      "Large Target Inputs",
      "Colorblind Mode",
      "Screen Reader",
      "Subtitles",
      "One-Handed Mode",
    ],
  };

  const RedDeadRedemption = {
    title: "Red Dead Redemption 2",
    genre: "Action-Adventure",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
  };

  describe("No filters selected", () => {
    it("should match all games when no filters are selected", () => {
      expect(matchesFilters(GTA, [], [])).toBe(true);
      expect(matchesFilters(Cyberpunk, [], [])).toBe(true);
      expect(matchesFilters(GodOfWar, [], [])).toBe(true);
      expect(matchesFilters(RedDeadRedemption, [], [])).toBe(true);
    });

    it("should match games when both filter arrays are empty", () => {
      expect(matchesFilters(GTA, [], [])).toBe(true);
    });
  });

  describe("Genre filtering - OR logic", () => {
    it("should match games with single selected genre", () => {
      // Action-Adventure games should match
      expect(matchesFilters(GTA, ["Action-Adventure"], [])).toBe(true);
      expect(matchesFilters(GodOfWar, ["Action-Adventure"], [])).toBe(true);
      expect(matchesFilters(RedDeadRedemption, ["Action-Adventure"], [])).toBe(true);

      // Action RPG games should match when Action RPG is selected
      expect(matchesFilters(Cyberpunk, ["Action RPG"], [])).toBe(true);
    });

    it("should not match games with different genre", () => {
      // Action RPG game should not match Action-Adventure filter
      expect(matchesFilters(Cyberpunk, ["Action-Adventure"], [])).toBe(false);

      // Action-Adventure games should not match Action RPG filter
      expect(matchesFilters(GTA, ["Action RPG"], [])).toBe(false);
      expect(matchesFilters(GodOfWar, ["Action RPG"], [])).toBe(false);
    });

    it("should match games that belong to ANY of the selected genres (OR logic)", () => {
      // When multiple genres are selected, match if game belongs to ANY of them
      expect(matchesFilters(GTA, ["Action-Adventure", "Action RPG"], [])).toBe(true);
      expect(matchesFilters(Cyberpunk, ["Action-Adventure", "Action RPG"], [])).toBe(true);
      expect(matchesFilters(GodOfWar, ["Action-Adventure", "Action RPG"], [])).toBe(true);
    });

    it("should match when game genre matches one of multiple selected genres", () => {
      // GTA is Action-Adventure, should match if Action-Adventure is in the list
      expect(matchesFilters(GTA, ["Action-Adventure", "RPG", "Shooter"], [])).toBe(true);

      // Cyberpunk is Action RPG, should match if Action RPG is in the list
      expect(matchesFilters(Cyberpunk, ["Action-Adventure", "Action RPG", "RPG"], [])).toBe(true);
    });

    it("should not match when game genre does not match any selected genre", () => {
      // None of our test games are "Horror" or "Puzzle"
      expect(matchesFilters(GTA, ["Horror", "Puzzle"], [])).toBe(false);
      expect(matchesFilters(Cyberpunk, ["Horror", "Puzzle"], [])).toBe(false);
    });
  });

  describe("Accessibility filtering - AND logic", () => {
    it("should match games with single selected accessibility feature", () => {
      // Games with "Colorblind Mode" should match
      expect(matchesFilters(GTA, [], ["Colorblind Mode"])).toBe(true);
      expect(matchesFilters(GodOfWar, [], ["Colorblind Mode"])).toBe(true);
      expect(matchesFilters(RedDeadRedemption, [], ["Colorblind Mode"])).toBe(true);
    });

    it("should not match games without the selected accessibility feature", () => {
      // Cyberpunk has empty accessibilityFeatures, should not match
      expect(matchesFilters(Cyberpunk, [], ["Colorblind Mode"])).toBe(false);
    });

    it("should match games with ALL selected accessibility features (AND logic)", () => {
      // Games must have BOTH "Colorblind Mode" AND "Subtitles"
      expect(matchesFilters(GTA, [], ["Colorblind Mode", "Subtitles"])).toBe(true);
      expect(matchesFilters(GodOfWar, [], ["Colorblind Mode", "Subtitles"])).toBe(true);
      expect(matchesFilters(RedDeadRedemption, [], ["Colorblind Mode", "Subtitles"])).toBe(true);
    });

    it("should not match games missing any of the required accessibility features", () => {
      // Cyberpunk has empty accessibilityFeatures, should not match
      expect(matchesFilters(Cyberpunk, [], ["Colorblind Mode", "Subtitles"])).toBe(false);
    });

    it("should match games that have all features even if they have additional features", () => {
      // GodOfWar has more features than required, but still matches
      expect(matchesFilters(GodOfWar, [], ["Colorblind Mode", "Subtitles"])).toBe(true);
      expect(matchesFilters(GodOfWar, [], ["Full Captions", "Subtitles"])).toBe(true);
    });

    it("should not match games missing one of multiple required features", () => {
      // A game with only "Colorblind Mode" should not match if "Subtitles" is also required
      const gameWithOnlyColorblind = {
        title: "Test Game",
        genre: "Action",
        accessibilityFeatures: ["Colorblind Mode"],
      };
      expect(matchesFilters(gameWithOnlyColorblind, [], ["Colorblind Mode", "Subtitles"])).toBe(
        false
      );
    });

    it("should not match games with empty accessibilityFeatures array", () => {
      // Cyberpunk has empty accessibilityFeatures
      expect(matchesFilters(Cyberpunk, [], ["Colorblind Mode"])).toBe(false);
      expect(matchesFilters(Cyberpunk, [], ["Subtitles"])).toBe(false);
      expect(matchesFilters(Cyberpunk, [], ["Any Feature"])).toBe(false);
    });
  });

  describe("Combined genre and accessibility filters", () => {
    it("should match games that satisfy BOTH genre AND accessibility filters", () => {
      // Action-Adventure games WITH Colorblind Mode and Subtitles
      expect(
        matchesFilters(GTA, ["Action-Adventure"], ["Colorblind Mode", "Subtitles"])
      ).toBe(true);
      expect(
        matchesFilters(GodOfWar, ["Action-Adventure"], ["Colorblind Mode", "Subtitles"])
      ).toBe(true);
      expect(
        matchesFilters(RedDeadRedemption, ["Action-Adventure"], ["Colorblind Mode", "Subtitles"])
      ).toBe(true);
    });

    it("should not match games that match genre but not accessibility", () => {
      // Cyberpunk is Action RPG but has no accessibility features
      expect(matchesFilters(Cyberpunk, ["Action RPG"], ["Colorblind Mode"])).toBe(false);
    });

    it("should not match games that match accessibility but not genre", () => {
      // GTA has accessibility features but is Action-Adventure, not Action RPG
      expect(matchesFilters(GTA, ["Action RPG"], ["Colorblind Mode", "Subtitles"])).toBe(false);
    });

    it("should require both filters to match when both are provided", () => {
      // Action RPG genre with accessibility features - no match since genre doesn't match
      expect(
        matchesFilters(GTA, ["Action RPG"], ["Colorblind Mode", "Subtitles"])
      ).toBe(false);

      // Action-Adventure genre without required accessibility - no match
      expect(matchesFilters(Cyberpunk, ["Action-Adventure"], ["Colorblind Mode"])).toBe(false);
    });

    it("should handle multiple genres with multiple accessibility features", () => {
      // Game matches one of the genres AND has all accessibility features
      expect(
        matchesFilters(GTA, ["Action-Adventure", "Action RPG"], ["Colorblind Mode", "Subtitles"])
      ).toBe(true);

      // Game matches genre but missing one accessibility feature
      const gameMissingFeature = {
        title: "Test Game",
        genre: "Action-Adventure",
        accessibilityFeatures: ["Colorblind Mode"], // Missing "Subtitles"
      };
      expect(
        matchesFilters(
          gameMissingFeature,
          ["Action-Adventure", "Action RPG"],
          ["Colorblind Mode", "Subtitles"]
        )
      ).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle games with undefined genre gracefully", () => {
      const gameWithoutGenre = {
        title: "Test Game",
        accessibilityFeatures: ["Colorblind Mode"],
      };
      expect(matchesFilters(gameWithoutGenre, ["Action-Adventure"], [])).toBe(false);
    });

    it("should handle games with null accessibilityFeatures", () => {
      const gameWithNullFeatures = {
        title: "Test Game",
        genre: "Action-Adventure",
        accessibilityFeatures: null,
      };
      expect(matchesFilters(gameWithNullFeatures, [], ["Colorblind Mode"])).toBe(false);
    });

    it("should handle games with undefined accessibilityFeatures", () => {
      const gameWithoutFeatures = {
        title: "Test Game",
        genre: "Action-Adventure",
      };
      expect(matchesFilters(gameWithoutFeatures, [], ["Colorblind Mode"])).toBe(false);
    });

    it("should handle case-insensitive matching for genres", () => {
      // The function uses toLowerCase, so case should not matter
      expect(matchesFilters(GTA, ["action-adventure"], [])).toBe(true);
      expect(matchesFilters(Cyberpunk, ["ACTION RPG"], [])).toBe(true);
    });

    it("should handle case-insensitive matching for accessibility features", () => {
      // The function uses toLowerCase, so case should not matter
      expect(matchesFilters(GTA, [], ["colorblind mode"])).toBe(true);
      expect(matchesFilters(GTA, [], ["COLORBLIND MODE"])).toBe(true);
      expect(matchesFilters(GTA, [], ["SUBTITLES"])).toBe(true);
    });

    it("should handle whitespace in genre matching", () => {
      // The function trims whitespace
      expect(matchesFilters(GTA, ["  Action-Adventure  "], [])).toBe(true);
      expect(matchesFilters(Cyberpunk, ["  Action RPG  "], [])).toBe(true);
    });

    it("should handle whitespace in accessibility feature matching", () => {
      // The function trims whitespace
      expect(matchesFilters(GTA, [], ["  Colorblind Mode  "])).toBe(true);
      expect(matchesFilters(GTA, [], ["  Subtitles  "])).toBe(true);
    });
  });
});

