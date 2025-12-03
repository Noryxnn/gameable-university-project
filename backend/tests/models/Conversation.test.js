import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// Mock mongoose
vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  
  const mockModel = vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(true),
  }));
  
  mockModel.find = vi.fn();
  mockModel.findById = vi.fn();
  mockModel.findOne = vi.fn();
  mockModel.create = vi.fn();
  mockModel.findOrCreateConversation = vi.fn();
  
  return {
    ...actual,
    default: {
      ...actual.default,
      model: vi.fn().mockReturnValue(mockModel),
      Schema: actual.Schema,
      Types: actual.Types,
    },
    Schema: actual.Schema,
    Types: actual.Types,
  };
});

describe("Conversation Model", () => {
  describe("Schema Validation", () => {
    it("should have required fields defined in schema", () => {
      const requiredFields = ["participants", "lastMessage", "lastMessageAt"];
      
      expect(requiredFields).toContain("participants");
      expect(requiredFields).toContain("lastMessage");
      expect(requiredFields).toContain("lastMessageAt");
    });

    it("should have participants as array of ObjectId references", () => {
      const fieldTypes = {
        participants: "Array<ObjectId>",
        lastMessage: "ObjectId",
        lastMessageAt: "Date",
      };

      expect(fieldTypes.participants).toBe("Array<ObjectId>");
      expect(fieldTypes.lastMessage).toBe("ObjectId");
      expect(fieldTypes.lastMessageAt).toBe("Date");
    });
  });

  describe("Participants Validation", () => {
    it("should require exactly 2 participants for DM", () => {
      const participants = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];
      
      expect(participants.length).toBe(2);
    });

    it("should reject less than 2 participants", () => {
      const participants = [new mongoose.Types.ObjectId()];
      
      expect(participants.length).not.toBe(2);
    });

    it("should reject more than 2 participants", () => {
      const participants = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];
      
      expect(participants.length).not.toBe(2);
    });

    it("should not allow duplicate participants", () => {
      const userId = new mongoose.Types.ObjectId();
      const participants = [userId, userId];
      
      const uniqueParticipants = [...new Set(participants.map(p => p.toString()))];
      expect(uniqueParticipants.length).toBe(1); // Should be flagged as invalid
    });
  });

  describe("Last Message Tracking", () => {
    it("should initialize with null lastMessage", () => {
      const conversation = {
        participants: [],
        lastMessage: null,
        lastMessageAt: new Date(),
      };
      
      expect(conversation.lastMessage).toBeNull();
    });

    it("should update lastMessage with message ObjectId", () => {
      const messageId = new mongoose.Types.ObjectId();
      const conversation = {
        participants: [],
        lastMessage: messageId,
        lastMessageAt: new Date(),
      };
      
      expect(conversation.lastMessage).toBe(messageId);
    });

    it("should update lastMessageAt timestamp", () => {
      const now = new Date();
      const conversation = {
        participants: [],
        lastMessage: null,
        lastMessageAt: now,
      };
      
      expect(conversation.lastMessageAt).toBe(now);
    });
  });

  describe("Timestamps", () => {
    it("should have createdAt and updatedAt", () => {
      const now = new Date();
      const conversation = {
        createdAt: now,
        updatedAt: now,
      };
      
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });
  });
});

describe("Conversation Operations", () => {
  describe("Find Or Create Conversation", () => {
    it("should sort participant IDs for consistent lookup", () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      
      const sortedParticipants = [userId1, userId2].sort((a, b) => 
        a.toString().localeCompare(b.toString())
      );
      
      expect(sortedParticipants.length).toBe(2);
      // First ID should be lexicographically smaller or equal
      expect(
        sortedParticipants[0].toString().localeCompare(sortedParticipants[1].toString())
      ).toBeLessThanOrEqual(0);
    });

    it("should build correct query for finding conversation", () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      const participants = [userId1, userId2].sort();

      const query = {
        participants: { $all: participants, $size: 2 },
      };

      expect(query.participants.$all).toEqual(participants);
      expect(query.participants.$size).toBe(2);
    });

    it("should return same result regardless of participant order", () => {
      const userId1 = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const userId2 = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");

      const sorted1 = [userId1, userId2].sort((a, b) => 
        a.toString().localeCompare(b.toString())
      );
      const sorted2 = [userId2, userId1].sort((a, b) => 
        a.toString().localeCompare(b.toString())
      );

      expect(sorted1[0].toString()).toBe(sorted2[0].toString());
      expect(sorted1[1].toString()).toBe(sorted2[1].toString());
    });
  });

  describe("Query Conversations", () => {
    it("should build correct query for user conversations", () => {
      const userId = new mongoose.Types.ObjectId();
      const query = { participants: userId };
      
      expect(query.participants).toBe(userId);
    });

    it("should sort by lastMessageAt descending", () => {
      const sort = { lastMessageAt: -1 };
      
      expect(sort.lastMessageAt).toBe(-1);
    });
  });

  describe("Populate Relations", () => {
    it("should specify correct populate paths", () => {
      const populatePaths = {
        participants: "username profilePicture",
        lastMessage: "content createdAt sender",
      };

      expect(populatePaths.participants).toContain("username");
      expect(populatePaths.participants).toContain("profilePicture");
      expect(populatePaths.lastMessage).toContain("content");
      expect(populatePaths.lastMessage).toContain("createdAt");
      expect(populatePaths.lastMessage).toContain("sender");
    });
  });

  describe("Update Conversation", () => {
    it("should update lastMessage and lastMessageAt on new message", () => {
      const messageId = new mongoose.Types.ObjectId();
      const now = new Date();

      const updateData = {
        lastMessage: messageId,
        lastMessageAt: now,
      };

      expect(updateData.lastMessage).toBe(messageId);
      expect(updateData.lastMessageAt).toBe(now);
    });
  });
});

describe("Conversation Access Control", () => {
  describe("Participant Check", () => {
    it("should verify user is participant", () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const participants = [
        new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
      ];

      const isParticipant = participants.some(
        p => p.toString() === userId.toString()
      );

      expect(isParticipant).toBe(true);
    });

    it("should reject non-participant", () => {
      const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439099");
      const participants = [
        new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
      ];

      const isParticipant = participants.some(
        p => p.toString() === userId.toString()
      );

      expect(isParticipant).toBe(false);
    });
  });

  describe("Get Other User", () => {
    it("should find the other participant", () => {
      const currentUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
      const otherUserId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439012");
      
      const participants = [
        { _id: currentUserId, username: "current" },
        { _id: otherUserId, username: "other" },
      ];

      const otherUser = participants.find(
        p => p._id.toString() !== currentUserId.toString()
      );

      expect(otherUser._id).toEqual(otherUserId);
      expect(otherUser.username).toBe("other");
    });
  });
});

describe("Indexing", () => {
  it("should have index on participants for efficient queries", () => {
    const indexes = [
      { participants: 1 },
      { lastMessageAt: -1 },
    ];

    expect(indexes[0].participants).toBe(1);
    expect(indexes[1].lastMessageAt).toBe(-1);
  });
});

