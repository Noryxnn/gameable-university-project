import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VoiceCommandButton, { VoiceCommandHelpModal } from "./VoiceCommandButton";

describe("VoiceCommandButton Component", () => {
  const defaultProps = {
    isListening: false,
    isSupported: true,
    transcript: "",
    interimTranscript: "",
    error: null,
    onToggle: vi.fn(),
    onShowHelp: vi.fn(),
    lastCommand: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the microphone button when supported", () => {
      render(<VoiceCommandButton {...defaultProps} />);

      const micButton = screen.getByLabelText("Start voice command");
      expect(micButton).toBeInTheDocument();
    });

    it("should render the help button", () => {
      render(<VoiceCommandButton {...defaultProps} />);

      const helpButton = screen.getByLabelText("Show voice command help");
      expect(helpButton).toBeInTheDocument();
    });

    it("should not render when not supported", () => {
      render(<VoiceCommandButton {...defaultProps} isSupported={false} />);

      const micButton = screen.queryByLabelText("Start voice command");
      expect(micButton).not.toBeInTheDocument();
    });

    it("should show stop label when listening", () => {
      render(<VoiceCommandButton {...defaultProps} isListening={true} />);

      const micButton = screen.getByLabelText("Stop voice command");
      expect(micButton).toBeInTheDocument();
    });
  });

  describe("Button States", () => {
    it("should have normal styling when not listening", () => {
      render(<VoiceCommandButton {...defaultProps} />);

      const micButton = screen.getByLabelText("Start voice command");
      expect(micButton).toHaveClass("from-purple-600");
    });

    it("should have active styling when listening", () => {
      render(<VoiceCommandButton {...defaultProps} isListening={true} />);

      const micButton = screen.getByLabelText("Stop voice command");
      expect(micButton).toHaveClass("from-red-500");
      expect(micButton).toHaveClass("animate-pulse");
    });

    it("should show listening indicator when listening", () => {
      render(<VoiceCommandButton {...defaultProps} isListening={true} />);

      // The pinging ring should be visible
      const pingRing = document.querySelector(".animate-ping");
      expect(pingRing).toBeInTheDocument();
    });
  });

  describe("Click Handlers", () => {
    it("should call onToggle when microphone button is clicked", () => {
      const onToggle = vi.fn();
      render(<VoiceCommandButton {...defaultProps} onToggle={onToggle} />);

      const micButton = screen.getByLabelText("Start voice command");
      fireEvent.click(micButton);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should call onShowHelp when help button is clicked", () => {
      const onShowHelp = vi.fn();
      render(<VoiceCommandButton {...defaultProps} onShowHelp={onShowHelp} />);

      const helpButton = screen.getByLabelText("Show voice command help");
      fireEvent.click(helpButton);

      expect(onShowHelp).toHaveBeenCalledTimes(1);
    });
  });

  describe("Feedback Display", () => {
    it("should show feedback when listening starts", () => {
      render(<VoiceCommandButton {...defaultProps} isListening={true} />);

      expect(screen.getByText("Listening...")).toBeInTheDocument();
    });

    it("should show transcript in feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="go to home"
          lastCommand={{ type: "navigate", target: "home" }}
        />
      );

      expect(screen.getByText(/Navigating to home/)).toBeInTheDocument();
    });

    it("should show interim transcript while speaking", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          isListening={true}
          interimTranscript="go to"
        />
      );

      expect(screen.getByText("go to")).toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    it("should show error message when error is not-allowed", () => {
      render(<VoiceCommandButton {...defaultProps} error="not-allowed" />);

      expect(
        screen.getByText(/Microphone access denied/)
      ).toBeInTheDocument();
    });

    it("should show error message when error is no-speech", () => {
      render(<VoiceCommandButton {...defaultProps} error="no-speech" />);

      expect(screen.getByText(/No speech detected/)).toBeInTheDocument();
    });

    it("should show generic error message for other errors", () => {
      render(<VoiceCommandButton {...defaultProps} error="network-error" />);

      expect(screen.getByText(/Error: network-error/)).toBeInTheDocument();
    });
  });

  describe("Command Feedback Types", () => {
    it("should show navigate feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "navigate", target: "profile" }}
        />
      );

      expect(screen.getByText(/Navigating to profile/)).toBeInTheDocument();
    });

    it("should show search feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "search", query: "zelda" }}
        />
      );

      expect(screen.getByText(/Searching for "zelda"/)).toBeInTheDocument();
    });

    it("should show filter feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "filter", filterType: "genre", value: "action" }}
        />
      );

      expect(screen.getByText(/Applying genre filter: action/)).toBeInTheDocument();
    });

    it("should show sort feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "sort", sortBy: "rating" }}
        />
      );

      expect(screen.getByText(/Sorting by rating/)).toBeInTheDocument();
    });

    it("should show rate feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "rate", rating: 5 }}
        />
      );

      expect(screen.getByText(/Rating: 5 stars/)).toBeInTheDocument();
    });

    it("should show openGameByName feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "openGameByName", gameName: "cyberpunk 2077" }}
        />
      );

      expect(screen.getByText(/Opening "cyberpunk 2077"/)).toBeInTheDocument();
    });

    it("should show unknown command error feedback", () => {
      render(
        <VoiceCommandButton
          {...defaultProps}
          transcript="test"
          lastCommand={{ type: "unknown", text: "gibberish" }}
        />
      );

      expect(screen.getByText(/Unknown command: "gibberish"/)).toBeInTheDocument();
    });
  });
});

describe("VoiceCommandHelpModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<VoiceCommandHelpModal isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByText("Voice Commands")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(<VoiceCommandHelpModal {...defaultProps} />);

      expect(screen.getByText("Voice Commands")).toBeInTheDocument();
    });

    it("should render all command categories", () => {
      render(<VoiceCommandHelpModal {...defaultProps} />);

      expect(screen.getByText("🧭 Navigation")).toBeInTheDocument();
      expect(screen.getByText("🔍 Search")).toBeInTheDocument();
      expect(screen.getByText("🎯 Filters")).toBeInTheDocument();
      expect(screen.getByText("📊 Sorting")).toBeInTheDocument();
      expect(screen.getByText("⭐ Reviews")).toBeInTheDocument();
      expect(screen.getByText("❤️ Favorites")).toBeInTheDocument();
      expect(screen.getByText("🎮 Games")).toBeInTheDocument();
      expect(screen.getByText("⚙️ Other")).toBeInTheDocument();
    });

    it("should render example commands", () => {
      render(<VoiceCommandHelpModal {...defaultProps} />);

      expect(screen.getByText('"Go to home"')).toBeInTheDocument();
      expect(screen.getByText('"Search for [game name]"')).toBeInTheDocument();
      expect(screen.getByText('"Rate 5 stars"')).toBeInTheDocument();
      expect(screen.getByText('"Open Cyberpunk 2077"')).toBeInTheDocument();
    });

    it("should render tips section", () => {
      render(<VoiceCommandHelpModal {...defaultProps} />);

      expect(screen.getByText("💡 Tips")).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn();
      render(<VoiceCommandHelpModal isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByLabelText("Close help");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      render(<VoiceCommandHelpModal isOpen={true} onClose={onClose} />);

      // Click on the backdrop (the semi-transparent overlay)
      const backdrop = document.querySelector(".bg-black\\/70");
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible close button", () => {
      render(<VoiceCommandHelpModal {...defaultProps} />);

      const closeButton = screen.getByLabelText("Close help");
      expect(closeButton).toBeInTheDocument();
    });

    it("should have proper heading structure", () => {
      render(<VoiceCommandHelpModal {...defaultProps} />);

      const heading = screen.getByRole("heading", { name: /Voice Commands/i });
      expect(heading).toBeInTheDocument();
    });
  });
});

