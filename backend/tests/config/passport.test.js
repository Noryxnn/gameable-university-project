import { describe, it, expect } from "vitest";
import { googleOAuthEnabled } from "../../config/passport.js";

describe("Passport Configuration", () => {
  describe("Google OAuth Strategy", () => {
    it("should export googleOAuthEnabled flag", () => {
      // Verify the flag is exported and is a boolean
      expect(typeof googleOAuthEnabled).toBe("boolean");
    });

    it("should have googleOAuthEnabled set based on environment", () => {
      // The flag should be set based on whether credentials exist in .env
      // This is a simple check that the module exports the flag correctly
      expect(googleOAuthEnabled).toBeDefined();
    });
  });

  describe("Module Structure", () => {
    it("should export googleOAuthEnabled from passport config", () => {
      // Verify the export exists
      expect(googleOAuthEnabled).not.toBeUndefined();
    });
  });
});

