import express from 'express';
import GameRequest from '../models/GameRequest.js';

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

// GET /api/game-requests/:id - Get a specific game request
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

