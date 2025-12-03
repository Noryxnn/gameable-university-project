import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";

// Mock models
vi.mock("../../models/Conversation.js", () => {
  const mockConversation = {
    _id: new mongoose.Types.ObjectId(),
    participants: [],
    lastMessage: null,
    lastMessageAt: new Date(),
    save: vi.fn().mockResolvedValue(true),
    populate: vi.fn().mockReturnThis(),
  };

  return {
    default: {
      find: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      findById: vi.fn().mockResolvedValue(mockConversation),
      findOrCreateConversation: vi.fn().mockResolvedValue(mockConversation),
      create: vi.fn().mockResolvedValue(mockConversation),
    },
  };
});

vi.mock("../../models/Message.js", () => {
  const mockMessage = {
    _id: new mongoose.Types.ObjectId(),
    conversation: new mongoose.Types.ObjectId(),
    sender: new mongoose.Types.ObjectId(),
    content: "Test message",
    readBy: [],
    createdAt: new Date(),
    populate: vi.fn().mockReturnThis(),
  };

  return {
    default: {
      find: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockMessage]),
          }),
        }),
      }),
      countDocuments: vi.fn().mockResolvedValue(0),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      create: vi.fn().mockResolvedValue(mockMessage),
    },
  };
});

vi.mock("../../models/User.js", () => {
  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    username: "testuser",
    email: "test@example.com",
    friends: [],
    profilePicture: "",
  };

  return {
    default: {
      findById: vi.fn().mockResolvedValue(mockUser),
    },
  };
});

// Mock auth middleware
vi.mock("../../middleware/auth.js", () => ({
  protect: vi.fn((req, res, next) => {
    req.user = {
      _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      username: "testuser",
      email: "test@example.com",
    };
    next();
  }),
}));

// Import after mocks
import chatRoutes from "../../routes/chat.js";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";

describe("Chat Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/chat", chatRoutes);
    vi.clearAllMocks();
  });

  describe("GET /api/chat/conversations", () => {
    it("should return empty array when no conversations exist", async () => {
      Conversation.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const response = await request(app).get("/api/chat/conversations");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return conversations with unread counts", async () => {
      const mockConv = {
        _id: new mongoose.Types.ObjectId(),
        participants: [
          { _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"), username: "testuser" },
          { _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"), username: "friend" },
        ],
        lastMessage: { content: "Hello", createdAt: new Date() },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      };

      Conversation.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue([mockConv]),
          }),
        }),
      });

      Message.countDocuments.mockResolvedValue(2);

      const response = await request(app).get("/api/chat/conversations");

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].unreadCount).toBe(2);
    });
  });

  describe("GET /api/chat/conversations/:friendId", () => {
    it("should return 404 if friend not found", async () => {
      User.findById.mockResolvedValue(null);

      const response = await request(app).get(
        `/api/chat/conversations/${new mongoose.Types.ObjectId()}`
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return 403 if users are not friends", async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        friends: [], // No friends
      };

      User.findById
        .mockResolvedValueOnce({ _id: new mongoose.Types.ObjectId() }) // Friend exists
        .mockResolvedValueOnce(mockUser); // Current user has no friends

      const response = await request(app).get(
        `/api/chat/conversations/${new mongoose.Types.ObjectId()}`
      );

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("You can only message friends");
    });

    it("should create or return conversation for friends", async () => {
      const friendId = new mongoose.Types.ObjectId();
      const currentUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

      const mockFriend = { _id: friendId, username: "friend" };
      const mockCurrentUser = {
        _id: currentUserId,
        friends: [friendId],
      };

      const mockConversation = {
        _id: new mongoose.Types.ObjectId(),
        participants: [
          { _id: currentUserId, username: "testuser", profilePicture: "" },
          { _id: friendId, username: "friend", profilePicture: "" },
        ],
        lastMessage: null,
        lastMessageAt: new Date(),
        populate: vi.fn().mockReturnThis(),
      };

      User.findById
        .mockResolvedValueOnce(mockFriend)
        .mockResolvedValueOnce(mockCurrentUser);

      Conversation.findOrCreateConversation.mockResolvedValue(mockConversation);

      const response = await request(app).get(`/api/chat/conversations/${friendId}`);

      expect(response.status).toBe(200);
      expect(Conversation.findOrCreateConversation).toHaveBeenCalled();
    });
  });

  describe("GET /api/chat/messages/:conversationId", () => {
    it("should return 404 if conversation not found", async () => {
      Conversation.findById.mockResolvedValue(null);

      const response = await request(app).get(
        `/api/chat/messages/${new mongoose.Types.ObjectId()}`
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Conversation not found");
    });

    it("should return 403 if user is not a participant", async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const mockConversation = {
        _id: new mongoose.Types.ObjectId(),
        participants: [otherUserId, new mongoose.Types.ObjectId()], // Current user not included
      };

      Conversation.findById.mockResolvedValue(mockConversation);

      const response = await request(app).get(
        `/api/chat/messages/${mockConversation._id}`
      );

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Access denied");
    });

    it("should return messages for valid conversation participant", async () => {
      const currentUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const conversationId = new mongoose.Types.ObjectId();

      const mockConversation = {
        _id: conversationId,
        participants: [currentUserId, new mongoose.Types.ObjectId()],
      };

      const mockMessages = [
        {
          _id: new mongoose.Types.ObjectId(),
          content: "Hello",
          sender: { _id: currentUserId, username: "testuser" },
          createdAt: new Date(),
        },
      ];

      Conversation.findById.mockResolvedValue(mockConversation);
      Message.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });

      const response = await request(app).get(`/api/chat/messages/${conversationId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(Message.updateMany).toHaveBeenCalled(); // Marks as read
    });
  });

  describe("POST /api/chat/messages/:conversationId", () => {
    it("should return 400 if content is empty", async () => {
      const response = await request(app)
        .post(`/api/chat/messages/${new mongoose.Types.ObjectId()}`)
        .send({ content: "" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Message content is required");
    });

    it("should return 404 if conversation not found", async () => {
      Conversation.findById.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/chat/messages/${new mongoose.Types.ObjectId()}`)
        .send({ content: "Hello" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Conversation not found");
    });

    it("should send message successfully", async () => {
      const currentUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const friendId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();

      const mockConversation = {
        _id: conversationId,
        participants: [currentUserId, friendId],
        save: vi.fn().mockResolvedValue(true),
      };

      const mockCurrentUser = {
        _id: currentUserId,
        friends: [friendId],
      };

      const mockMessage = {
        _id: new mongoose.Types.ObjectId(),
        conversation: conversationId,
        sender: currentUserId,
        content: "Hello!",
        readBy: [currentUserId],
        createdAt: new Date(),
        populate: vi.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          content: "Hello!",
          sender: { _id: currentUserId, username: "testuser" },
        }),
      };

      Conversation.findById.mockResolvedValue(mockConversation);
      User.findById.mockResolvedValue(mockCurrentUser);
      Message.create.mockResolvedValue(mockMessage);

      const response = await request(app)
        .post(`/api/chat/messages/${conversationId}`)
        .send({ content: "Hello!" });

      expect(response.status).toBe(201);
      expect(Message.create).toHaveBeenCalled();
      expect(mockConversation.save).toHaveBeenCalled();
    });
  });

  describe("GET /api/chat/unread", () => {
    it("should return total unread count", async () => {
      Conversation.find.mockResolvedValue([
        { _id: new mongoose.Types.ObjectId() },
      ]);
      Message.countDocuments.mockResolvedValue(5);

      const response = await request(app).get("/api/chat/unread");

      expect(response.status).toBe(200);
      expect(response.body.unreadCount).toBe(5);
    });

    it("should return 0 when no unread messages", async () => {
      Conversation.find.mockResolvedValue([]);
      Message.countDocuments.mockResolvedValue(0);

      const response = await request(app).get("/api/chat/unread");

      expect(response.status).toBe(200);
      expect(response.body.unreadCount).toBe(0);
    });
  });

  describe("POST /api/chat/messages/:conversationId/read", () => {
    it("should return 404 if conversation not found", async () => {
      Conversation.findById.mockResolvedValue(null);

      const response = await request(app).post(
        `/api/chat/messages/${new mongoose.Types.ObjectId()}/read`
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Conversation not found");
    });

    it("should mark messages as read successfully", async () => {
      const currentUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const conversationId = new mongoose.Types.ObjectId();

      const mockConversation = {
        _id: conversationId,
        participants: [currentUserId, new mongoose.Types.ObjectId()],
      };

      Conversation.findById.mockResolvedValue(mockConversation);
      Message.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const response = await request(app).post(
        `/api/chat/messages/${conversationId}/read`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Message.updateMany).toHaveBeenCalled();
    });
  });
});

describe("Chat Models", () => {
  describe("Conversation Model", () => {
    it("should have required fields", () => {
      // Test that the mock has expected methods
      expect(Conversation.find).toBeDefined();
      expect(Conversation.findById).toBeDefined();
      expect(Conversation.findOrCreateConversation).toBeDefined();
    });
  });

  describe("Message Model", () => {
    it("should have required fields", () => {
      expect(Message.find).toBeDefined();
      expect(Message.create).toBeDefined();
      expect(Message.countDocuments).toBeDefined();
      expect(Message.updateMany).toBeDefined();
    });
  });
});

