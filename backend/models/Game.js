import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    developer: { type: String, required: true },
    genre: { type: String, required: true },
    description: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    releaseDate: { type: String }, // Full release date for display
    imageUrl: { type: String, required: true },
    trailerUrl: { type: String }, // YouTube embed URL
    rating: { type: String, required: true },
    reviewScore: { type: Number, default: 0 }, // Average score out of 5
    reviewCount: { type: Number, default: 0 },
    accessibilityFeatures: [{ type: String }],
    features: [{ type: String }], // Game features list
    downloadLink: { type: String }, // External store link
}, { timestamps: true });

const Game = mongoose.model("Game", gameSchema);

export default Game;

