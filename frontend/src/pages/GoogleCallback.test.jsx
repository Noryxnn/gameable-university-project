import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GoogleCallback from "./GoogleCallback";
import axios from "axios";

// Mock axios
vi.mock("axios");

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Helper to render GoogleCallback component with URL parameters
 */
const renderGoogleCallback = (searchParams = "") => {
  const mockSetUser = vi.fn();
  return {
    ...render(
      <MemoryRouter initialEntries={[`/auth/google/callback${searchParams}`]}>
        <GoogleCallback setUser={mockSetUser} />
      </MemoryRouter>
    ),
    mockSetUser,
  };
};

describe("GoogleCallback Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockReset();
    localStorage.clear();
  });

  describe("Loading State", () => {
    it("displays loading spinner initially", () => {
      renderGoogleCallback("?token=mock-token");

      expect(screen.getByText(/completing authentication/i)).toBeInTheDocument();
    });
  });

  describe("Successful Authentication", () => {
    it("stores token and fetches user data on successful callback", async () => {
      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        isAdmin: false,
      };
      axios.get.mockResolvedValue({ data: mockUser });

      const { mockSetUser } = renderGoogleCallback("?token=mock-jwt-token");

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith("token", "mock-jwt-token");
      });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/users/me", {
          headers: { Authorization: "Bearer mock-jwt-token" },
        });
      });

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/home");
      });
    });
  });

  describe("Error Handling - Missing Token", () => {
    it("displays error when no token is provided", async () => {
      renderGoogleCallback("");

      await waitFor(() => {
        expect(screen.getByText(/no authentication token received/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/redirecting to login page/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });
  });

  describe("Error Handling - Backend Errors", () => {
    it("displays error message for google_auth_failed", async () => {
      renderGoogleCallback("?error=google_auth_failed");

      await waitFor(() => {
        expect(screen.getByText(/google authentication failed. please try again/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });

    it("displays error message for google_oauth_not_configured", async () => {
      renderGoogleCallback("?error=google_oauth_not_configured");

      await waitFor(() => {
        expect(
          screen.getByText(/google oauth is not configured on the server. please use email\/password login/i)
        ).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });

    it("displays error message for account_banned", async () => {
      renderGoogleCallback("?error=account_banned");

      await waitFor(() => {
        expect(screen.getByText(/your account has been banned. please contact support/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });

    it("displays error message for server_error", async () => {
      renderGoogleCallback("?error=server_error");

      await waitFor(() => {
        expect(screen.getByText(/server error. please try again later/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });
  });

  describe("Error Handling - Banned User", () => {
    it("removes token and redirects when user is banned", async () => {
      const mockBannedUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        isBanned: true,
      };
      axios.get.mockResolvedValue({ data: mockBannedUser });

      renderGoogleCallback("?token=mock-token");

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith("token");
      });

      await waitFor(() => {
        expect(screen.getByText(/your account has been banned. please contact support/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });
  });

  describe("Error Handling - API Failure", () => {
    it("handles error when fetching user data fails", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));

      renderGoogleCallback("?token=mock-token");

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch user data. please try again/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith("token");
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/login");
      }, { timeout: 4000 });
    });
  });
});

