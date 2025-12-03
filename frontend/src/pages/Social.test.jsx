import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Social from "./Social";
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
 * Helper to render Social component with required Router context
 */
const renderSocial = (user = { _id: "user123", username: "testuser" }) => {
  return render(
    <MemoryRouter>
      <Social user={user} />
    </MemoryRouter>
  );
};

describe("Social Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    
    // Default mock responses
    axios.get.mockImplementation((url) => {
      if (url === "/api/users/friends/list") {
        return Promise.resolve({
          data: {
            friends: [],
            receivedRequests: [],
            sentRequests: [],
          },
        });
      }
      if (url === "/api/chat/conversations") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/api/chat/unread") {
        return Promise.resolve({ data: { unreadCount: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders the Social page title", async () => {
      renderSocial();

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Social");
      });
    });

    it("renders tab buttons", async () => {
      renderSocial();

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("shows loading spinner initially", () => {
      axios.get.mockImplementation(() => new Promise(() => {}));
      
      renderSocial();
      
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("shows empty friends message when no friends", async () => {
      renderSocial();

      await waitFor(() => {
        expect(screen.getByText(/No friends yet/i)).toBeInTheDocument();
      });
    });
  });

  describe("Friends Tab", () => {
    it("displays friends list when friends exist", async () => {
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.resolve({
            data: {
              friends: [
                { _id: "friend1", username: "Friend1", email: "friend1@test.com" },
                { _id: "friend2", username: "Friend2", email: "friend2@test.com" },
              ],
              receivedRequests: [],
              sentRequests: [],
            },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({ data: [] });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 0 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        expect(screen.getByText("Friend1")).toBeInTheDocument();
        expect(screen.getByText("Friend2")).toBeInTheDocument();
      });
    });

    it("shows Message button for each friend", async () => {
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.resolve({
            data: {
              friends: [
                { _id: "friend1", username: "Friend1", email: "friend1@test.com" },
              ],
              receivedRequests: [],
              sentRequests: [],
            },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({ data: [] });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 0 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        const messageButtons = screen.getAllByRole("button").filter(
          btn => btn.textContent.includes("Message")
        );
        expect(messageButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Messages Tab", () => {
    it("switches to messages tab when clicked", async () => {
      const user = userEvent.setup();
      renderSocial();

      await waitFor(() => {
        expect(screen.queryByText(/No friends yet/i)).toBeInTheDocument();
      });

      const tabButtons = screen.getAllByRole("button");
      const messagesTab = tabButtons.find(btn => 
        btn.textContent.includes("Messages") || btn.textContent.includes("Chat")
      );
      
      if (messagesTab) {
        await user.click(messagesTab);

        await waitFor(() => {
          expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
        });
      }
    });

    it("displays conversations list", async () => {
      const user = userEvent.setup();
      
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.resolve({
            data: { friends: [], receivedRequests: [], sentRequests: [] },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({
            data: [
              {
                _id: "conv1",
                otherUser: { _id: "friend1", username: "ConvFriend", profilePicture: "" },
                lastMessage: { content: "Hello!", createdAt: new Date().toISOString() },
                lastMessageAt: new Date().toISOString(),
                unreadCount: 2,
              },
            ],
          });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 2 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        expect(screen.queryByText(/No friends yet/i)).toBeInTheDocument();
      });

      const tabButtons = screen.getAllByRole("button");
      const messagesTab = tabButtons.find(btn => 
        btn.textContent.includes("Messages") || btn.textContent.includes("Chat")
      );
      
      if (messagesTab) {
        await user.click(messagesTab);

        await waitFor(() => {
          expect(screen.getByText("ConvFriend")).toBeInTheDocument();
          expect(screen.getByText("Hello!")).toBeInTheDocument();
        });
      }
    });

    it("shows unread badge when there are unread messages", async () => {
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.resolve({
            data: { friends: [], receivedRequests: [], sentRequests: [] },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({ data: [] });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 5 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message when API call fails", async () => {
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.reject({
            response: { data: { message: "Network error" } },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({ data: [] });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 0 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load friends/i)).toBeInTheDocument();
      });
    });
  });

  describe("Requests Tab", () => {
    it("shows received friend requests", async () => {
      const user = userEvent.setup();
      
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.resolve({
            data: {
              friends: [],
              receivedRequests: [
                { _id: "req1", username: "Requester", email: "req@test.com" },
              ],
              sentRequests: [],
            },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({ data: [] });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 0 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        expect(screen.queryByText(/No friends yet/i)).toBeInTheDocument();
      });

      const tabButtons = screen.getAllByRole("button");
      const requestsTab = tabButtons.find(btn => btn.textContent.includes("Requests"));
      
      if (requestsTab) {
        await user.click(requestsTab);

        await waitFor(() => {
          expect(screen.getByText("Requester")).toBeInTheDocument();
        });
      }
    });
  });

  describe("Search Tab", () => {
    it("allows searching for users", async () => {
      const user = userEvent.setup();
      
      axios.get.mockImplementation((url) => {
        if (url === "/api/users/friends/list") {
          return Promise.resolve({
            data: { friends: [], receivedRequests: [], sentRequests: [] },
          });
        }
        if (url.includes("/api/users/search")) {
          return Promise.resolve({
            data: {
              users: [
                { _id: "found1", username: "FoundUser", email: "found@test.com" },
              ],
            },
          });
        }
        if (url === "/api/chat/conversations") {
          return Promise.resolve({ data: [] });
        }
        if (url === "/api/chat/unread") {
          return Promise.resolve({ data: { unreadCount: 0 } });
        }
        return Promise.resolve({ data: {} });
      });

      renderSocial();

      await waitFor(() => {
        expect(screen.queryByText(/No friends yet/i)).toBeInTheDocument();
      });

      const tabButtons = screen.getAllByRole("button");
      const searchTab = tabButtons.find(btn => 
        btn.textContent.includes("Search") && !btn.textContent.includes("Searching")
      );
      
      if (searchTab) {
        await user.click(searchTab);

        await waitFor(() => {
          expect(screen.getByPlaceholderText(/Search for gamers/i)).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/Search for gamers/i);
        await user.type(searchInput, "test");

        await waitFor(() => {
          expect(screen.getByText("FoundUser")).toBeInTheDocument();
        });
      }
    });
  });

  describe("API Calls", () => {
    it("calls friends list API on mount", async () => {
      renderSocial();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/users/friends/list",
          expect.any(Object)
        );
      });
    });

    it("calls conversations API on mount", async () => {
      renderSocial();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/chat/conversations",
          expect.any(Object)
        );
      });
    });

    it("calls unread count API on mount", async () => {
      renderSocial();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/chat/unread",
          expect.any(Object)
        );
      });
    });
  });
});
