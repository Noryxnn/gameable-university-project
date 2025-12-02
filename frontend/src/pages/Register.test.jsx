import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";
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
 * Helper to render Register component with required Router context
 */
const renderRegister = () => {
  const mockSetUser = vi.fn();
  return {
    ...render(
      <MemoryRouter>
        <Register setUser={mockSetUser} />
      </MemoryRouter>
    ),
    mockSetUser,
  };
};

describe("Register Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    axios.post.mockReset();
  });

  describe("Rendering", () => {
    it("renders the registration form with all required fields", () => {
      renderRegister();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    });

    it("renders the Google sign up button", () => {
      renderRegister();

      const googleButton = screen.getByRole("button", { name: /continue with google/i });
      expect(googleButton).toBeInTheDocument();
    });

    it("renders the 'Or continue with' divider", () => {
      renderRegister();

      expect(screen.getByText(/or continue with/i)).toBeInTheDocument();
    });

    it("renders link to login page", () => {
      renderRegister();

      const loginLink = screen.getByRole("link", { name: /login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Form Input", () => {
    it("allows user to type in all form fields", async () => {
      const user = userEvent.setup();
      renderRegister();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(usernameInput, "testuser");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      expect(usernameInput).toHaveValue("testuser");
      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
      expect(confirmPasswordInput).toHaveValue("password123");
    });
  });

  describe("Form Validation", () => {
    it("displays error when passwords do not match", async () => {
      const user = userEvent.setup();
      renderRegister();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /register/i });

      await user.type(usernameInput, "testuser");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "differentpassword");
      await user.click(submitButton);

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("allows submission when passwords match", async () => {
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

      const { mockSetUser } = renderRegister();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /register/i });

      await user.type(usernameInput, "testuser");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(submitButton);

      expect(axios.post).toHaveBeenCalledWith("/api/users/register", {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  describe("Google OAuth Button", () => {
    it("redirects to Google OAuth endpoint when clicked", () => {
      renderRegister();

      const googleButton = screen.getByRole("button", { name: /continue with google/i });
      fireEvent.click(googleButton);

      expect(mockLocation.href).toBe("/api/users/auth/google");
    });
  });

  describe("Error Handling", () => {
    it("displays error message on registration failure", async () => {
      const user = userEvent.setup();
      const errorResponse = {
        response: {
          data: {
            message: "User already exists",
          },
        },
      };
      axios.post.mockRejectedValue(errorResponse);

      renderRegister();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /register/i });

      await user.type(usernameInput, "testuser");
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");
      await user.click(submitButton);

      expect(await screen.findByText("User already exists")).toBeInTheDocument();
    });
  });
});

