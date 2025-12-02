import express from 'express';
import Review from '../models/Review.js';
import Game from '../models/Game.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews for a game
router.get('/game/:gameId', async (req, res) => {
    try {
        const reviews = await Review.find({ gameId: req.params.gameId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a review (requires authentication)
router.post('/', protect, async (req, res) => {
    try {
        const { gameId, rating, content } = req.body;
        
        if (!gameId || !rating || !content) {
            return res.status(400).json({ message: 'Please provide gameId, rating, and content' });
        }

        // Check if user already reviewed this game
        const existingReview = await Review.findOne({ 
            gameId, 
            userId: req.user._id 
        });
        
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this game' });
        }

        const review = await Review.create({
            gameId,
            userId: req.user._id,
            username: req.user.username,
            rating,
            content,
            profilePicture: req.user.profilePicture
        });

        // Update game's average rating
        const allReviews = await Review.find({ gameId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        await Game.findByIdAndUpdate(gameId, {
            reviewScore: Math.round(avgRating * 10) / 10,
            reviewCount: allReviews.length
        });

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this game' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Update a review
router.put('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }
        
        const { rating, content } = req.body;
        review.rating = rating || review.rating;
        review.content = content || review.content;
        
        await review.save();
        
        // Update game's average rating
        const allReviews = await Review.find({ gameId: review.gameId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        await Game.findByIdAndUpdate(review.gameId, {
            reviewScore: Math.round(avgRating * 10) / 10
        });
        
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a review (users can delete their own, admins can delete any)
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        // Allow deletion if user owns the review OR user is admin
        const isOwner = review.userId.toString() === req.user._id.toString();
        const isAdminUser = req.user.isAdmin;
        
        if (!isOwner && !isAdminUser) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }
        
        const gameId = review.gameId;
        await review.deleteOne();
        
        // Update game's average rating
        const allReviews = await Review.find({ gameId });
        const avgRating = allReviews.length > 0 
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
            : 0;
        
        await Game.findByIdAndUpdate(gameId, {
            reviewScore: Math.round(avgRating * 10) / 10,
            reviewCount: allReviews.length
        });
        
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

