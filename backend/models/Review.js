import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    gameId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Game', 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    username: { type: String, required: true },
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    },
    content: { type: String, required: true },
    profilePicture: { type: String },
}, { timestamps: true });

// Ensure one review per user per game
reviewSchema.index({ gameId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;

