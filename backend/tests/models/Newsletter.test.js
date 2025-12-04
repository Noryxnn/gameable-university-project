import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import User from "../../models/User.js";

describe("User Model - Newsletter Fields", () => {
  it("should create user with newsletterOptIn defaulting to false", () => {
    const userData = {
      username: "newslettertest1",
      email: "newsletter1@test.com",
      password: "password123"
    };

    const user = new User(userData);

    expect(user.newsletterOptIn).toBe(false);
    expect(user.newsletterOptInUpdatedAt).toBeUndefined();
  });

  it("should allow setting newsletterOptIn to true", () => {
    const userData = {
      username: "newslettertest2",
      email: "newsletter2@test.com",
      password: "password123",
      newsletterOptIn: true,
      newsletterOptInUpdatedAt: new Date()
    };

    const user = new User(userData);

    expect(user.newsletterOptIn).toBe(true);
    expect(user.newsletterOptInUpdatedAt).toBeInstanceOf(Date);
  });

  it("should allow setting newsletterOptIn to false explicitly", () => {
    const userData = {
      username: "newslettertest3",
      email: "newsletter3@test.com",
      password: "password123",
      newsletterOptIn: false
    };

    const user = new User(userData);

    expect(user.newsletterOptIn).toBe(false);
  });

  it("should allow updating newsletterOptIn field", () => {
    const userData = {
      username: "newslettertest4",
      email: "newsletter4@test.com",
      password: "password123",
      newsletterOptIn: false
    };

    const user = new User(userData);
    user.newsletterOptIn = true;
    user.newsletterOptInUpdatedAt = new Date();

    expect(user.newsletterOptIn).toBe(true);
    expect(user.newsletterOptInUpdatedAt).toBeInstanceOf(Date);
  });

  it("should handle newsletterOptInUpdatedAt as null", () => {
    const userData = {
      username: "newslettertest5",
      email: "newsletter5@test.com",
      password: "password123",
      newsletterOptIn: false,
      newsletterOptInUpdatedAt: null
    };

    const user = new User(userData);

    expect(user.newsletterOptIn).toBe(false);
    expect(user.newsletterOptInUpdatedAt).toBeNull();
  });
});

