import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure only 2 participants per conversation (DM style)
conversationSchema.pre('save', function(next) {
    if (this.participants.length !== 2) {
        return next(new Error('Conversation must have exactly 2 participants'));
    }
    next();
});

// Index for efficient querying
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Static method to find or create a conversation between two users
conversationSchema.statics.findOrCreateConversation = async function(userId1, userId2) {
    // Sort IDs to ensure consistent lookup
    const participants = [userId1, userId2].sort();
    
    let conversation = await this.findOne({
        participants: { $all: participants, $size: 2 }
    });
    
    if (!conversation) {
        conversation = await this.create({ participants });
    }
    
    return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

