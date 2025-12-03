import express from 'express';
import Game from '../models/Game.js';
import { protect, admin } from '../middleware/auth.js';
import { buildGameFilterQuery, parseFilterParam } from '../utils/gameFilters.js';
import newsletterService from '../services/NewsletterService.js';

const router = express.Router();

// Get all games with optional filtering by genre and accessibility features
router.get('/', async (req, res) => {
    try {
        // Parse query parameters
        const genres = parseFilterParam(req.query.genres);
        const accessibilityFeatures = parseFilterParam(req.query.accessibility);

        // Build filter query
        const filterQuery = buildGameFilterQuery(genres, accessibilityFeatures);

        // Fetch games with filters applied
        const games = await Game.find(filterQuery).sort({ createdAt: -1 });
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single game by ID
router.get('/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new game (admin only)
router.post('/', protect, admin, async (req, res) => {
    try {
        const { 
            title, 
            developer, 
            genre, 
            description, 
            releaseYear, 
            releaseDate,
            imageUrl, 
            trailerUrl,
            rating, 
            accessibilityFeatures,
            features,
            downloadLink
        } = req.body;
        
        // Validate required fields
        if (!title || !developer || !genre || !description || !releaseYear || !imageUrl || !rating) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const game = await Game.create({
            title,
            developer,
            genre,
            description,
            releaseYear,
            releaseDate: releaseDate || null,
            imageUrl,
            trailerUrl: trailerUrl || null,
            rating,
            accessibilityFeatures: accessibilityFeatures || [],
            features: features || [],
            downloadLink: downloadLink || null
        });

        // Send newsletter to opted-in users (fire and forget - don't block response)
        newsletterService.sendNewGameAnnouncement(game).catch(err => {
            console.error('Newsletter sending failed (non-blocking):', err);
        });

        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a game (admin only)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const game = await Game.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a game (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const game = await Game.findByIdAndDelete(req.params.id);
        
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        
        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

