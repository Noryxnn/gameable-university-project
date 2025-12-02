import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import Login from "./Login";
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

// Mock window.location
const mockLocation = {
  href: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

/**
 * Helper to render Login component with required Router context
 */
const renderLogin = (initialEntries = ["/login"]) => {
  const mockSetUser = vi.fn();
  return {
    ...render(
      <MemoryRouter initialEntries={initialEntries}>
        <Login setUser={mockSetUser} />
      </MemoryRouter>
    ),
    mockSetUser,
  };
};

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    axios.post.mockReset();
    localStorage.clear();
    // Mock localStorage methods using spies
    vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(Storage.prototype, "getItem");
    vi.spyOn(Storage.prototype, "removeItem");
  });

  describe("Rendering", () => {
    it("renders the login form with email and password fields", () => {
      renderLogin();

      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("renders the Google login button", () => {
      renderLogin();

      const googleButton = screen.getByRole("button", { name: /continue with google/i });
      expect(googleButton).toBeInTheDocument();
    });

    it("renders the 'Or continue with' divider", () => {
      renderLogin();

      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });

    it("renders link to register page", () => {
      renderLogin();

      const registerLink = screen.getByRole("link", { name: /sign up/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("renders link to forgot password page", () => {
      renderLogin();

      const forgotPasswordLink = screen.getByRole("link", { name: /forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("Form Input", () => {
    it("allows user to type in email field", async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, "test@example.com");

      expect(emailInput).toHaveValue("test@example.com");
    });

    it("allows user to type in password field", async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      await user.type(passwordInput, "password123");

      expect(passwordInput).toHaveValue("password123");
    });
  });

  describe("Form Submission", () => {
    it("calls login API and navigates on successful login", async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          token: "mock-jwt-token",
          id: "user123",
          username: "testuser",
          email: "test@example.com",
          isAdmin: false,
        },
      };
      axios.post.mockResolvedValue(mockResponse);

      const { mockSetUser } = renderLogin();

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/users/login", {
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(Storage.prototype.setItem).toHaveBeenCalledWith("token", "mock-jwt-token");
      expect(mockSetUser).toHaveBeenCalledWith(mockResponse.data);
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });

    it("displays error message on login failure", async () => {
      const user = userEvent.setup();
      const errorResponse = {
        response: {
          data: {
            message: "Invalid credentials",
          },
        },
      };
      axios.post.mockRejectedValue(errorResponse);

      renderLogin();

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });
  });

  describe("Google OAuth Button", () => {
    it("redirects to Google OAuth endpoint when clicked", () => {
      renderLogin();

      const googleButton = screen.getByRole("button", { name: /continue with google/i });
      fireEvent.click(googleButton);

      expect(mockLocation.href).toBe("/api/users/auth/google");
    });
  });

  describe("Error Handling from URL Parameters", () => {
    it("displays error message when google_oauth_not_configured error is in URL", () => {
      renderLogin(["/login?error=google_oauth_not_configured"]);

      expect(
        screen.getByText(/google oauth is not configured. please use email\/password to login/i)
      ).toBeInTheDocument();
    });

    it("displays error message when google_auth_failed error is in URL", () => {
      renderLogin(["/login?error=google_auth_failed"]);

      expect(screen.getByText(/google authentication failed. please try again/i)).toBeInTheDocument();
    });

    it("displays error message when account_banned error is in URL", () => {
      renderLogin(["/login?error=account_banned"]);

      expect(screen.getByText(/your account has been banned. please contact support/i)).toBeInTheDocument();
    });

    it("does not display error when no error parameter is in URL", () => {
      renderLogin(["/login"]);

      expect(screen.queryByText(/google oauth is not configured/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/google authentication failed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/account has been banned/i)).not.toBeInTheDocument();
    });
  });
});

