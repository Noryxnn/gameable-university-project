import express from 'express';
import GameRequest from '../models/GameRequest.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/game-requests - Submit a new game request
router.post('/', async (req, res) => {
    try {
        const { gameTitle, gameLink, accessibilityFeatures, userId } = req.body;
        
        // Debug logging
        console.log('Received game request:', { gameTitle, gameLink, accessibilityFeatures, userId });

        // Validate required fields
        if (!gameTitle || !gameLink) {
            return res.status(400).json({ 
                message: 'Game title and link are required' 
            });
        }

        // Validate accessibility features
        if (!accessibilityFeatures || !Array.isArray(accessibilityFeatures) || accessibilityFeatures.length === 0) {
            return res.status(400).json({ 
                message: 'Please select at least one accessibility feature' 
            });
        }

        // Validate accessibility feature values
        const validFeatures = ['Hearing Accessibility', 'Dexterity / Motor Accessibility', 'Vision / Low-Vision Accessibility', 'Cognitive Accessibility', 'General Assistive Features'];
        const invalidFeatures = accessibilityFeatures.filter(f => !validFeatures.includes(f));
        if (invalidFeatures.length > 0) {
            return res.status(400).json({ 
                message: 'Invalid accessibility features provided' 
            });
        }

        // Basic URL validation
        try {
            new URL(gameLink);
        } catch {
            return res.status(400).json({ 
                message: 'Please provide a valid URL' 
            });
        }

        // Check if this game has already been requested (by title, case-insensitive)
        const existingRequest = await GameRequest.findOne({ 
            gameTitle: { $regex: new RegExp(`^${gameTitle}$`, 'i') }
        });

        if (existingRequest) {
            return res.status(400).json({ 
                message: 'This game has already been requested. We\'re reviewing it!' 
            });
        }

        // Create new game request
        const gameRequest = new GameRequest({
            gameTitle,
            gameLink,
            accessibilityFeatures,
            userId: userId || null,
        });

        await gameRequest.save();
        
        // Debug logging
        console.log('Saved game request:', gameRequest);

        res.status(201).json({ 
            message: 'Game request submitted successfully',
            request: gameRequest
        });

    } catch (error) {
        console.error('Error creating game request:', error);
        res.status(500).json({ 
            message: 'Failed to submit game request. Please try again.' 
        });
    }
});

// GET /api/game-requests - Get all game requests (for admin purposes)
router.get('/', async (req, res) => {
    try {
        const requests = await GameRequest.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'username email');
        
        res.json(requests);
    } catch (error) {
        console.error('Error fetching game requests:', error);
        res.status(500).json({ 
            message: 'Failed to fetch game requests' 
        });
    }
});

// Admin routes - require authentication and admin privileges
// These specific routes must come before the generic /:id route
// PUT /api/game-requests/:id/approve - Approve a game request
router.put('/:id/approve', protect, admin, async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                message: 'Game request not found' 
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ 
                message: 'Request has already been processed' 
            });
        }

        request.status = 'approved';
        request.reviewedAt = new Date();
        request.notes = req.body.notes || request.notes;
        
        await request.save();

        res.json({ 
            message: 'Game request approved',
            request 
        });
    } catch (error) {
        console.error('Error approving game request:', error);
        res.status(500).json({ 
            message: 'Failed to approve game request' 
        });
    }
});

// PUT /api/game-requests/:id/decline - Decline a game request
router.put('/:id/decline', protect, admin, async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                message: 'Game request not found' 
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ 
                message: 'Request has already been processed' 
            });
        }

        request.status = 'rejected';
        request.reviewedAt = new Date();
        request.notes = req.body.notes || request.notes;
        
        await request.save();

        res.json({ 
            message: 'Game request declined',
            request 
        });
    } catch (error) {
        console.error('Error declining game request:', error);
        res.status(500).json({ 
            message: 'Failed to decline game request' 
        });
    }
});

// PUT /api/game-requests/:id/added - Mark request as added (game was created)
router.put('/:id/added', protect, admin, async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                message: 'Game request not found' 
            });
        }

        request.status = 'added';
        request.reviewedAt = new Date();
        request.notes = req.body.notes || request.notes;
        
        await request.save();

        res.json({ 
            message: 'Game request marked as added',
            request 
        });
    } catch (error) {
        console.error('Error marking game request as added:', error);
        res.status(500).json({ 
            message: 'Failed to update game request' 
        });
    }
});

// DELETE /api/game-requests/:id - Delete a game request (admin only)
// Must be placed before GET /:id to ensure proper route matching
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const request = await GameRequest.findByIdAndDelete(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                message: 'Game request not found' 
            });
        }

        res.json({ 
            message: 'Game request deleted successfully',
            request 
        });
    } catch (error) {
        console.error('Error deleting game request:', error);
        res.status(500).json({ 
            message: 'Failed to delete game request',
            error: error.message 
        });
    }
});

// GET /api/game-requests/:id - Get a specific game request
// This must come after all specific routes (approve, decline, added, delete)
router.get('/:id', async (req, res) => {
    try {
        const request = await GameRequest.findById(req.params.id)
            .populate('userId', 'username email');
        
        if (!request) {
            return res.status(404).json({ 
                message: 'Game request not found' 
            });
        }

        res.json(request);
    } catch (error) {
        console.error('Error fetching game request:', error);
        res.status(500).json({ 
            message: 'Failed to fetch game request' 
        });
    }
});

export default router;

