import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
    title: { type: String, required: true },
    developer: { type: String, required: true },
    genre: { type: String, required: true },
    description: { type: String, required: true },
    releaseYear: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    rating: { type: String, required: true },
    accessibilityFeatures: [{ type: String }],
}, { timestamps: true });

const Game = mongoose.model("Game", gameSchema);

export default Game;

