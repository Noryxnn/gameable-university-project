import { describe, it, expect } from "vitest";
import { parseFilterParam, buildGameFilterQuery } from "../../utils/gameFilters.js";

describe("gameFilters utils - Unit Tests", () => {
  describe("parseFilterParam", () => {
    it("should return empty array for undefined input", () => {
      const result = parseFilterParam(undefined);
      expect(result).toEqual([]);
    });

    it("should return empty array for null input", () => {
      const result = parseFilterParam(null);
      expect(result).toEqual([]);
    });

    it("should return empty array for non-string input", () => {
      const result = parseFilterParam(123);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      const result = parseFilterParam("");
      expect(result).toEqual([]);
    });

    it("should parse single value string", () => {
      const result = parseFilterParam("Action RPG");
      expect(result).toEqual(["Action RPG"]);
    });

    it("should parse comma-separated string with spaces", () => {
      const result = parseFilterParam("Action-Adventure, Action RPG");
      expect(result).toEqual(["Action-Adventure", "Action RPG"]);
    });

    it("should trim whitespace from values", () => {
      const result = parseFilterParam("  Action RPG  ,  Adventure  ");
      expect(result).toEqual(["Action RPG", "Adventure"]);
    });

    it("should filter out empty strings from extra commas", () => {
      const result = parseFilterParam("Action RPG,,Adventure,");
      expect(result).toEqual(["Action RPG", "Adventure"]);
    });

    it("should handle strings with only whitespace", () => {
      const result = parseFilterParam("  ,  ,  ");
      expect(result).toEqual([]);
    });

    it("should parse multiple values correctly", () => {
      const result = parseFilterParam("Action-Adventure,Action RPG,Adventure");
      expect(result).toEqual(["Action-Adventure", "Action RPG", "Adventure"]);
    });

    it("should handle accessibility features with spaces in names", () => {
      const result = parseFilterParam("Colorblind Mode,Full Captions");
      expect(result).toEqual(["Colorblind Mode", "Full Captions"]);
    });
  });

  describe("buildGameFilterQuery", () => {
    it("should return empty object when no filters provided", () => {
      const result = buildGameFilterQuery([], []);
      expect(result).toEqual({});
    });

    it("should return empty object when both arrays are empty", () => {
      const result = buildGameFilterQuery();
      expect(result).toEqual({});
    });

    describe("Genre filtering (OR logic)", () => {
      it("should include genre condition for single genre", () => {
        const result = buildGameFilterQuery(["Action-Adventure"], []);
        expect(result).toHaveProperty("genre");
        expect(result.genre).toEqual({ $in: ["Action-Adventure"] });
      });

      it("should include genre condition with $in for multiple genres", () => {
        const result = buildGameFilterQuery(["Action-Adventure", "Action RPG"], []);
        expect(result).toHaveProperty("genre");
        expect(result.genre).toEqual({ $in: ["Action-Adventure", "Action RPG"] });
      });

      it("should not include genre condition when genres array is empty", () => {
        const result = buildGameFilterQuery([], []);
        expect(result).not.toHaveProperty("genre");
      });

      it("should handle three or more genres with OR logic", () => {
        const genres = ["Action-Adventure", "Action RPG", "Adventure"];
        const result = buildGameFilterQuery(genres, []);
        expect(result.genre).toEqual({ $in: genres });
      });
    });

    describe("Accessibility filtering (AND logic)", () => {
      it("should include accessibilityFeatures condition for single feature", () => {
        const result = buildGameFilterQuery([], ["Colorblind Mode"]);
        expect(result).toHaveProperty("accessibilityFeatures");
        expect(result.accessibilityFeatures).toEqual({ $all: ["Colorblind Mode"] });
      });

      it("should include accessibilityFeatures condition with $all for multiple features", () => {
        const features = ["Colorblind Mode", "Subtitles"];
        const result = buildGameFilterQuery([], features);
        expect(result).toHaveProperty("accessibilityFeatures");
        expect(result.accessibilityFeatures).toEqual({ $all: features });
      });

      it("should not include accessibilityFeatures condition when array is empty", () => {
        const result = buildGameFilterQuery([], []);
        expect(result).not.toHaveProperty("accessibilityFeatures");
      });

      it("should handle multiple accessibility features with AND logic", () => {
        const features = ["Colorblind Mode", "Subtitles", "Full Captions"];
        const result = buildGameFilterQuery([], features);
        expect(result.accessibilityFeatures).toEqual({ $all: features });
      });
    });

    describe("Combined genre and accessibility filtering", () => {
      it("should include both genre and accessibilityFeatures conditions", () => {
        const genres = ["Action-Adventure"];
        const features = ["Colorblind Mode"];
        const result = buildGameFilterQuery(genres, features);

        expect(result).toHaveProperty("genre");
        expect(result).toHaveProperty("accessibilityFeatures");
        expect(result.genre).toEqual({ $in: genres });
        expect(result.accessibilityFeatures).toEqual({ $all: features });
      });

      it("should combine multiple genres with multiple accessibility features", () => {
        const genres = ["Action-Adventure", "Action RPG"];
        const features = ["Colorblind Mode", "Subtitles"];
        const result = buildGameFilterQuery(genres, features);

        expect(result.genre).toEqual({ $in: genres });
        expect(result.accessibilityFeatures).toEqual({ $all: features });
      });

      it("should only include genre when accessibility is empty", () => {
        const genres = ["Action-Adventure"];
        const result = buildGameFilterQuery(genres, []);

        expect(result).toHaveProperty("genre");
        expect(result).not.toHaveProperty("accessibilityFeatures");
      });

      it("should only include accessibilityFeatures when genre is empty", () => {
        const features = ["Colorblind Mode"];
        const result = buildGameFilterQuery([], features);

        expect(result).not.toHaveProperty("genre");
        expect(result).toHaveProperty("accessibilityFeatures");
      });
    });
  });
});

