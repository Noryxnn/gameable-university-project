import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Settings from "./Settings";

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window.speechSynthesis
const mockSpeechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
};
Object.defineProperty(window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
});

// Mock SpeechSynthesisUtterance
// eslint-disable-next-line no-undef
global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}));

/**
 * Helper to render Settings component with required Router context
 */
const renderSettings = (user = undefined) => {
  const defaultUser = {
    _id: "user123",
    username: "testuser",
    email: "test@example.com",
    profilePicture: "",
  };

  return {
    ...render(
      <MemoryRouter>
        <Settings user={user !== undefined ? user : defaultUser} />
      </MemoryRouter>
    ),
  };
};

describe("Settings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock localStorage methods
    vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(Storage.prototype, "getItem");
    vi.spyOn(Storage.prototype, "removeItem");
    
    // Reset document.body.style.filter
    document.body.style.filter = "none";
    
    // Reset speechSynthesis mocks
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis.speak.mockClear();
  });

  afterEach(() => {
    document.body.style.filter = "none";
  });

  describe("Rendering", () => {
    it("renders the Settings page header", () => {
      renderSettings();

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(
        screen.getByText("Manage your account and accessibility preferences")
      ).toBeInTheDocument();
    });

    it("renders the profile box with user information", () => {
      const user = {
        username: "johndoe",
        email: "john@example.com",
        profilePicture: "",
      };
      renderSettings(user);

      expect(screen.getByText("johndoe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders the Account button in profile box", () => {
      renderSettings();

      const accountButton = screen.getByRole("button", { name: /account/i });
      expect(accountButton).toBeInTheDocument();
    });

    it("renders the Color Blind Mode section", () => {
      renderSettings();

      expect(screen.getByText("Color Blind Mode")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Adjust the website colors to better suit your color vision needs"
        )
      ).toBeInTheDocument();
    });

    it("renders the Text-to-Speech section", () => {
      renderSettings();

      expect(screen.getByText("Text-to-Speech")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Enable text-to-speech to have text read aloud when you click on it"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Profile Box", () => {
    it("displays user avatar with initial letter when no profile picture", () => {
      const user = {
        username: "testuser",
        email: "test@example.com",
        profilePicture: "",
      };
      renderSettings(user);

      // Should show the initial letter
      expect(screen.getByText("T")).toBeInTheDocument();
    });

    it("displays profile picture when available", () => {
      const user = {
        username: "testuser",
        email: "test@example.com",
        profilePicture: "/uploads/profile.jpg",
      };
      renderSettings(user);

      const profileImage = screen.getByAltText("Profile");
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute("src", "/uploads/profile.jpg");
    });

    it("navigates to profile page when Account button is clicked", async () => {
      const user = userEvent.setup();
      renderSettings();

      const accountButton = screen.getByRole("button", { name: /account/i });
      await user.click(accountButton);

      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });

    it("handles profile picture error gracefully", () => {
      const user = {
        username: "testuser",
        email: "test@example.com",
        profilePicture: "/uploads/invalid.jpg",
      };
      renderSettings(user);

      const profileImage = screen.getByAltText("Profile");
      
      // Simulate image load error
      fireEvent.error(profileImage);

      // Should fall back to showing initial letter
      expect(screen.getByText("T")).toBeInTheDocument();
    });
  });

  describe("Color Blind Mode", () => {
    it("renders all color blind mode options", () => {
      renderSettings();

      expect(screen.getByLabelText(/none \(normal\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/protanopia \(red-blind\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deuteranopia \(green-blind\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tritanopia \(blue-blind\)/i)).toBeInTheDocument();
    });

    it("defaults to 'none' when no preference is saved", () => {
      renderSettings();

      const noneOption = screen.getByLabelText(/none \(normal\)/i);
      expect(noneOption).toBeChecked();
    });

    it("loads saved color blind mode preference from localStorage", () => {
      localStorage.setItem("colorBlindMode", "protanopia");
      renderSettings();

      const protanopiaOption = screen.getByLabelText(/protanopia \(red-blind\)/i);
      expect(protanopiaOption).toBeChecked();
    });

    it("applies color blind filter when mode is changed", async () => {
      const user = userEvent.setup();
      renderSettings();

      const protanopiaOption = screen.getByLabelText(/protanopia \(red-blind\)/i);
      await user.click(protanopiaOption);

      await waitFor(() => {
        expect(document.body.style.filter).toBe("url(#protanopia)");
      });
    });

    it("saves color blind mode preference to localStorage", async () => {
      const user = userEvent.setup();
      renderSettings();

      const deuteranopiaOption = screen.getByLabelText(/deuteranopia \(green-blind\)/i);
      await user.click(deuteranopiaOption);

      await waitFor(() => {
        expect(Storage.prototype.setItem).toHaveBeenCalledWith(
          "colorBlindMode",
          "deuteranopia"
        );
      });
    });

    it("dispatches colorBlindModeChanged event when mode changes", async () => {
      const user = userEvent.setup();
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      renderSettings();

      const tritanopiaOption = screen.getByLabelText(/tritanopia \(blue-blind\)/i);
      await user.click(tritanopiaOption);

      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "colorBlindModeChanged",
          })
        );
      });

      dispatchSpy.mockRestore();
    });

    it("removes filter when 'none' is selected", async () => {
      const user = userEvent.setup();
      // First set a filter
      localStorage.setItem("colorBlindMode", "protanopia");
      renderSettings();

      // Then select none
      const noneOption = screen.getByLabelText(/none \(normal\)/i);
      await user.click(noneOption);

      await waitFor(() => {
        expect(document.body.style.filter).toBe("none");
      });
    });

    it("applies correct filter for each color blind type", async () => {
      const user = userEvent.setup();
      renderSettings();

      // Test protanopia
      const protanopiaOption = screen.getByLabelText(/protanopia \(red-blind\)/i);
      await user.click(protanopiaOption);
      await waitFor(() => {
        expect(document.body.style.filter).toBe("url(#protanopia)");
      });

      // Test deuteranopia
      const deuteranopiaOption = screen.getByLabelText(/deuteranopia \(green-blind\)/i);
      await user.click(deuteranopiaOption);
      await waitFor(() => {
        expect(document.body.style.filter).toBe("url(#deuteranopia)");
      });

      // Test tritanopia
      const tritanopiaOption = screen.getByLabelText(/tritanopia \(blue-blind\)/i);
      await user.click(tritanopiaOption);
      await waitFor(() => {
        expect(document.body.style.filter).toBe("url(#tritanopia)");
      });
    });
  });

  describe("Text-to-Speech", () => {
    it("renders the text-to-speech toggle", () => {
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      expect(toggle).toBeInTheDocument();
    });

    it("defaults to disabled when no preference is saved", () => {
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      expect(toggle).not.toBeChecked();
      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("loads saved text-to-speech preference from localStorage", () => {
      localStorage.setItem("textToSpeechEnabled", "true");
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      expect(toggle).toBeChecked();
      expect(screen.getByText("Enabled")).toBeInTheDocument();
    });

    it("shows tip message when text-to-speech is enabled", () => {
      localStorage.setItem("textToSpeechEnabled", "true");
      renderSettings();

      expect(
        screen.getByText(/💡 Tip: Click on any text element to have it read aloud/i)
      ).toBeInTheDocument();
    });

    it("hides tip message when text-to-speech is disabled", () => {
      renderSettings();

      expect(
        screen.queryByText(/💡 Tip: Click on any text element to have it read aloud/i)
      ).not.toBeInTheDocument();
    });

    it("toggles text-to-speech when checkbox is clicked", async () => {
      const user = userEvent.setup();
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      expect(toggle).not.toBeChecked();

      await user.click(toggle);

      expect(toggle).toBeChecked();
      expect(screen.getByText("Enabled")).toBeInTheDocument();
    });

    it("saves text-to-speech preference to localStorage when toggled", async () => {
      const user = userEvent.setup();
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      await user.click(toggle);

      await waitFor(() => {
        expect(Storage.prototype.setItem).toHaveBeenCalledWith(
          "textToSpeechEnabled",
          "true"
        );
      });
    });

    it("dispatches textToSpeechChanged event when toggled", async () => {
      const user = userEvent.setup();
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      await user.click(toggle);

      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "textToSpeechChanged",
            detail: { enabled: true },
          })
        );
      });

      dispatchSpy.mockRestore();
    });

    it("cancels speech synthesis when disabled", async () => {
      const user = userEvent.setup();
      localStorage.setItem("textToSpeechEnabled", "true");
      renderSettings();

      const toggle = screen.getByRole("checkbox");
      expect(toggle).toBeChecked();

      await user.click(toggle);

      await waitFor(() => {
        expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      });
    });

    it("updates status text when toggled", async () => {
      const user = userEvent.setup();
      renderSettings();

      expect(screen.getByText("Disabled")).toBeInTheDocument();

      const toggle = screen.getByRole("checkbox");
      await user.click(toggle);

      expect(screen.getByText("Enabled")).toBeInTheDocument();

      await user.click(toggle);

      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("maintains both preferences independently", async () => {
      const user = userEvent.setup();
      localStorage.setItem("colorBlindMode", "deuteranopia");
      localStorage.setItem("textToSpeechEnabled", "true");
      renderSettings();

      // Verify both are set
      expect(screen.getByLabelText(/deuteranopia \(green-blind\)/i)).toBeChecked();
      expect(screen.getByRole("checkbox")).toBeChecked();

      // Change color blind mode
      const protanopiaOption = screen.getByLabelText(/protanopia \(red-blind\)/i);
      await user.click(protanopiaOption);

      // Text-to-speech should still be enabled
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("handles user with missing properties gracefully", () => {
      renderSettings(null);

      // When user is null, it should still render with default values
      // The component uses user?.username || "User", so it should show "User"
      expect(screen.getByText("User")).toBeInTheDocument();
      
      // Should show initial letter "U"
      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("handles user with partial data", () => {
      const partialUser = {
        username: "partial",
      };
      renderSettings(partialUser);

      expect(screen.getByText("partial")).toBeInTheDocument();
      expect(screen.getByText("P")).toBeInTheDocument();
    });
  });
});

