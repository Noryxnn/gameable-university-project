import express from 'express';
import { protect } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
        .populate('participants', 'username profilePicture')
        .populate('lastMessage', 'content createdAt sender')
        .sort({ lastMessageAt: -1 });

        // Format conversations to include unread count and other user info
        const formattedConversations = await Promise.all(
            conversations.map(async (conv) => {
                // Get the other participant
                const otherParticipant = conv.participants.find(
                    p => p._id.toString() !== req.user._id.toString()
                );

                // Count unread messages
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: req.user._id },
                    readBy: { $ne: req.user._id }
                });

                return {
                    _id: conv._id,
                    otherUser: otherParticipant,
                    lastMessage: conv.lastMessage,
                    lastMessageAt: conv.lastMessageAt,
                    unreadCount,
                    updatedAt: conv.updatedAt
                };
            })
        );

        res.json(formattedConversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/chat/conversations/:friendId
// @desc    Get or create a conversation with a friend
// @access  Private
router.get('/conversations/:friendId', protect, async (req, res) => {
    try {
        const { friendId } = req.params;

        // Check if the other user exists
        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if they are friends
        const currentUser = await User.findById(req.user._id);
        const areFriends = currentUser.friends.some(
            f => f.toString() === friendId
        );

        if (!areFriends) {
            return res.status(403).json({ message: 'You can only message friends' });
        }

        // Find or create conversation
        const conversation = await Conversation.findOrCreateConversation(
            req.user._id,
            friendId
        );

        // Populate the conversation
        await conversation.populate('participants', 'username profilePicture');
        await conversation.populate('lastMessage', 'content createdAt sender');

        const otherParticipant = conversation.participants.find(
            p => p._id.toString() !== req.user._id.toString()
        );

        res.json({
            _id: conversation._id,
            otherUser: otherParticipant,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
        });
    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/chat/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get('/messages/:conversationId', protect, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { before, limit = 50 } = req.query;

        // Check if user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Build query
        const query = { conversation: conversationId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        // Get messages
        const messages = await Message.find(query)
            .populate('sender', 'username profilePicture')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id }
            },
            { $addToSet: { readBy: req.user._id } }
        );

        // Return in chronological order
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/chat/messages/:conversationId
// @desc    Send a message in a conversation
// @access  Private
router.post('/messages/:conversationId', protect, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Check if user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if they are still friends
        const currentUser = await User.findById(req.user._id);
        const otherUserId = conversation.participants.find(
            p => p.toString() !== req.user._id.toString()
        );
        
        const areFriends = currentUser.friends.some(
            f => f.toString() === otherUserId.toString()
        );

        if (!areFriends) {
            return res.status(403).json({ message: 'You can only message friends' });
        }

        // Create message
        const message = await Message.create({
            conversation: conversationId,
            sender: req.user._id,
            content: content.trim(),
            readBy: [req.user._id]
        });

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        // Populate and return
        await message.populate('sender', 'username profilePicture');

        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/chat/unread
// @desc    Get total unread message count
// @access  Private
router.get('/unread', protect, async (req, res) => {
    try {
        // Get all conversations for the user
        const conversations = await Conversation.find({
            participants: req.user._id
        });

        const conversationIds = conversations.map(c => c._id);

        // Count unread messages
        const unreadCount = await Message.countDocuments({
            conversation: { $in: conversationIds },
            sender: { $ne: req.user._id },
            readBy: { $ne: req.user._id }
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/chat/messages/:conversationId/read
// @desc    Mark all messages in a conversation as read
// @access  Private
router.post('/messages/:conversationId/read', protect, async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Check if user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Mark all messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id }
            },
            { $addToSet: { readBy: req.user._id } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

