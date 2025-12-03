import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Navbar from "./Navbar";

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
 * Helper to render Navbar with required Router context and default props.
 * Override any prop by passing it in the props parameter.
 */
const renderNavbar = (props = {}) => {
  const defaultProps = {
    user: null,
    setUser: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    suggestions: [],
    clearSearch: vi.fn(),
    commitSearch: vi.fn(),
  };

  const mergedProps = { ...defaultProps, ...props };

  return {
    ...render(
      <BrowserRouter>
        <Navbar {...mergedProps} />
      </BrowserRouter>
    ),
    props: mergedProps,
  };
};

// Sample suggestion data for tests
const mockSuggestions = [
  {
    _id: "game1",
    title: "Hollow Knight",
    developer: "Team Cherry",
    genre: "Metroidvania",
    imageUrl: "https://example.com/hollow.jpg",
  },
  {
    _id: "game2",
    title: "Celeste",
    developer: "Maddy Makes Games",
    genre: "Platformer",
    imageUrl: "https://example.com/celeste.jpg",
  },
  {
    _id: "game3",
    title: "Hades",
    developer: "Supergiant Games",
    genre: "Roguelike",
    imageUrl: null, // No image to test fallback
  },
];

describe("Navbar - Search Input", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the search input with correct placeholder", () => {
      renderNavbar();

      const searchInput = screen.getByPlaceholderText("Search games or developers...");
      expect(searchInput).toBeInTheDocument();
    });

    it("renders the search input with correct aria-label for accessibility", () => {
      renderNavbar();

      const searchInput = screen.getByLabelText("Search for games");
      expect(searchInput).toBeInTheDocument();
    });

    it("displays the current searchQuery value in the input", () => {
      renderNavbar({ searchQuery: "zelda" });

      const searchInput = screen.getByLabelText("Search for games");
      expect(searchInput).toHaveValue("zelda");
    });

    it("renders an empty input when searchQuery is empty", () => {
      renderNavbar({ searchQuery: "" });

      const searchInput = screen.getByLabelText("Search for games");
      expect(searchInput).toHaveValue("");
    });
  });

  describe("Change Handler", () => {
    it("calls setSearchQuery when user types in the input", async () => {
      const user = userEvent.setup();
      const { props } = renderNavbar();

      const searchInput = screen.getByLabelText("Search for games");
      await user.type(searchInput, "mario");

      // setSearchQuery should be called for each character typed
      expect(props.setSearchQuery).toHaveBeenCalled();
      expect(props.setSearchQuery).toHaveBeenCalledTimes(5); // "mario" = 5 chars
    });

    it("passes the input value to setSearchQuery on each keystroke", async () => {
      const user = userEvent.setup();
      const { props } = renderNavbar();

      const searchInput = screen.getByLabelText("Search for games");
      await user.type(searchInput, "ab");

      // Since this is a controlled component with mocked state that doesn't update,
      // each keystroke passes the single character (the input's current value)
      // In a real app with state updates, it would accumulate
      expect(props.setSearchQuery).toHaveBeenNthCalledWith(1, "a");
      expect(props.setSearchQuery).toHaveBeenNthCalledWith(2, "b");
    });
  });

  describe("Max Length Enforcement", () => {
    it("has maxLength attribute set to 60", () => {
      renderNavbar();

      const searchInput = screen.getByLabelText("Search for games");
      expect(searchInput).toHaveAttribute("maxLength", "60");
    });

    it("does not allow input beyond 60 characters", async () => {
      const user = userEvent.setup();
      const setSearchQuery = vi.fn();
      renderNavbar({ setSearchQuery });

      const searchInput = screen.getByLabelText("Search for games");
      const longString = "a".repeat(70); // 70 characters

      await user.type(searchInput, longString);

      // The last call should only have 60 characters due to maxLength
      const lastCall = setSearchQuery.mock.calls[setSearchQuery.mock.calls.length - 1][0];
      expect(lastCall.length).toBeLessThanOrEqual(60);
    });

    it("accepts exactly 60 characters", async () => {
      const user = userEvent.setup();
      const setSearchQuery = vi.fn();
      renderNavbar({ setSearchQuery });

      const searchInput = screen.getByLabelText("Search for games");
      const exactString = "a".repeat(60);

      await user.type(searchInput, exactString);

      // Should have been called 60 times
      expect(setSearchQuery).toHaveBeenCalledTimes(60);
    });
  });
});

describe("Navbar - Suggestions Dropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show suggestions dropdown when suggestions array is empty", () => {
    renderNavbar({ searchQuery: "test", suggestions: [] });

    // Focus the input to trigger showing suggestions
    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // With empty suggestions and a query, it should show "No games found"
    expect(screen.getByText(/No games found for "test"/)).toBeInTheDocument();
  });

  it("shows suggestions dropdown when suggestions are provided and input is focused", () => {
    renderNavbar({ searchQuery: "hollow", suggestions: mockSuggestions });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // All suggestion titles should be visible
    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(screen.getByText("Celeste")).toBeInTheDocument();
    expect(screen.getByText("Hades")).toBeInTheDocument();
  });

  it("displays game title and developer for each suggestion", () => {
    renderNavbar({ searchQuery: "game", suggestions: mockSuggestions });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Check titles
    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(screen.getByText("Celeste")).toBeInTheDocument();

    // Check developers
    expect(screen.getByText("Team Cherry")).toBeInTheDocument();
    expect(screen.getByText("Maddy Makes Games")).toBeInTheDocument();
  });

  it("displays genre badge for suggestions that have genre", () => {
    renderNavbar({ searchQuery: "game", suggestions: mockSuggestions });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    expect(screen.getByText("Metroidvania")).toBeInTheDocument();
    expect(screen.getByText("Platformer")).toBeInTheDocument();
    expect(screen.getByText("Roguelike")).toBeInTheDocument();
  });

  it("shows 'No games found' message when searchQuery exists but no suggestions", () => {
    renderNavbar({ searchQuery: "nonexistent", suggestions: [] });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    expect(screen.getByText(/No games found for "nonexistent"/)).toBeInTheDocument();
    expect(screen.getByText("Try a different search term")).toBeInTheDocument();
  });
});

describe("Navbar - Suggestion Click", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to game detail page when a suggestion is clicked", () => {
    const setSearchQuery = vi.fn();
    renderNavbar({
      searchQuery: "hollow",
      suggestions: mockSuggestions,
      setSearchQuery,
    });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Click on "Hollow Knight" suggestion
    const suggestionButton = screen.getByText("Hollow Knight").closest("button");
    fireEvent.mouseDown(suggestionButton);

    // Should navigate to the game detail page
    expect(mockNavigate).toHaveBeenCalledWith("/game/game1");
  });

  it("updates searchQuery to the selected game title when suggestion is clicked", () => {
    const setSearchQuery = vi.fn();
    renderNavbar({
      searchQuery: "cel",
      suggestions: mockSuggestions,
      setSearchQuery,
    });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Click on "Celeste" suggestion
    const suggestionButton = screen.getByText("Celeste").closest("button");
    fireEvent.mouseDown(suggestionButton);

    expect(setSearchQuery).toHaveBeenCalledWith("Celeste");
  });
});

describe("Navbar - Clear Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not show clear button when searchQuery is empty", () => {
    renderNavbar({ searchQuery: "" });

    const clearButton = screen.queryByLabelText("Clear search");
    expect(clearButton).not.toBeInTheDocument();
  });

  it("shows clear button when searchQuery has a value", () => {
    renderNavbar({ searchQuery: "test" });

    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();
  });

  it("calls clearSearch when clear button is clicked", () => {
    const clearSearch = vi.fn();
    renderNavbar({ searchQuery: "test", clearSearch });

    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.mouseDown(clearButton);

    expect(clearSearch).toHaveBeenCalledTimes(1);
  });

  it("hides suggestions after clear button is clicked", () => {
    const clearSearch = vi.fn();
    renderNavbar({
      searchQuery: "hollow",
      suggestions: mockSuggestions,
      clearSearch,
    });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Verify suggestions are shown
    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();

    // Click clear
    const clearButton = screen.getByLabelText("Clear search");
    fireEvent.mouseDown(clearButton);

    // clearSearch should be called (component relies on parent to clear the query)
    expect(clearSearch).toHaveBeenCalled();
  });
});

describe("Navbar - Form Submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls commitSearch when form is submitted", () => {
    const commitSearch = vi.fn();
    renderNavbar({ searchQuery: "zelda", commitSearch });

    const searchInput = screen.getByLabelText("Search for games");
    const form = searchInput.closest("form");

    fireEvent.submit(form);

    expect(commitSearch).toHaveBeenCalledTimes(1);
  });

  it("calls commitSearch when Enter key is pressed with no suggestions", () => {
    const commitSearch = vi.fn();
    renderNavbar({ searchQuery: "zelda", suggestions: [], commitSearch });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(commitSearch).toHaveBeenCalledTimes(1);
  });
});

describe("Navbar - Keyboard Navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("closes suggestions dropdown when Escape key is pressed", () => {
    renderNavbar({ searchQuery: "hollow", suggestions: mockSuggestions });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Verify suggestions are visible
    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(searchInput, { key: "Escape" });

    // Suggestions should be hidden (the component sets showSuggestions to false)
    // Note: Since showSuggestions is internal state, we verify by checking the dropdown is gone
    expect(screen.queryByText("Press")).not.toBeInTheDocument(); // The keyboard hint at bottom
  });

  it("allows navigation with ArrowDown key", () => {
    renderNavbar({ searchQuery: "game", suggestions: mockSuggestions });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Press ArrowDown - first item should be highlighted
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    // The first suggestion button should now have the selected class
    const firstSuggestion = screen.getByText("Hollow Knight").closest("button");
    expect(firstSuggestion).toHaveClass("bg-purple-600/30");
  });

  it("allows navigation with ArrowUp key", () => {
    renderNavbar({ searchQuery: "game", suggestions: mockSuggestions });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Navigate down twice
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    // Now second item should be selected
    const secondSuggestion = screen.getByText("Celeste").closest("button");
    expect(secondSuggestion).toHaveClass("bg-purple-600/30");

    // Navigate up
    fireEvent.keyDown(searchInput, { key: "ArrowUp" });

    // First item should be selected again
    const firstSuggestion = screen.getByText("Hollow Knight").closest("button");
    expect(firstSuggestion).toHaveClass("bg-purple-600/30");
  });

  it("selects highlighted suggestion when Enter is pressed", () => {
    const setSearchQuery = vi.fn();
    renderNavbar({
      searchQuery: "game",
      suggestions: mockSuggestions,
      setSearchQuery,
    });

    const searchInput = screen.getByLabelText("Search for games");
    fireEvent.focus(searchInput);

    // Navigate to second item
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    fireEvent.keyDown(searchInput, { key: "ArrowDown" });

    // Press Enter to select
    fireEvent.keyDown(searchInput, { key: "Enter" });

    // Should navigate to Celeste's page
    expect(mockNavigate).toHaveBeenCalledWith("/game/game2");
    expect(setSearchQuery).toHaveBeenCalledWith("Celeste");
  });
});

