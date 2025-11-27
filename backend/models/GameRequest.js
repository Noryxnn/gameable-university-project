import mongoose from 'mongoose';

const gameRequestSchema = new mongoose.Schema({
    gameTitle: { 
        type: String, 
        required: true,
        trim: true
    },
    gameLink: { 
        type: String, 
        required: true,
        trim: true
    },
    accessibilityFeatures: [{
        type: String,
        enum: ['Hearing Accessibility', 'Dexterity / Motor Accessibility', 'Vision / Low-Vision Accessibility', 'Cognitive Accessibility', 'General Assistive Features']
    }],
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'added'],
        default: 'pending'
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const GameRequest = mongoose.model("GameRequest", gameRequestSchema);

export default GameRequest;

