import express from 'express';
import Game from '../models/Game.js';

const router = express.Router();

// Get all games
router.get('/', async (req, res) => {
    try {
        const games = await Game.find().sort({ createdAt: -1 });
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

// Create a new game
router.post('/', async (req, res) => {
    try {
        const { title, developer, genre, description, releaseYear, imageUrl, rating, accessibilityFeatures } = req.body;
        
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
            imageUrl,
            rating,
            accessibilityFeatures: accessibilityFeatures || []
        });

        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a game
router.put('/:id', async (req, res) => {
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

// Delete a game
router.delete('/:id', async (req, res) => {
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

