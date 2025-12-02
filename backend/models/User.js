import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// user schema for the database
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    gamingPlatforms: {
        steam: { type: String, default: "" },
        xboxLive: { type: String, default: "" },
        playstationNetwork: { type: String, default: "" },
        xTwitter: { type: String, default: "" },
        instagram: { type: String, default: "" },
        facebook: { type: String, default: "" }
    },
    favoriteGames: [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
},{ timestamps: true }); 

// Initialize gamingPlatforms if it doesn't exist
userSchema.pre("save", function(next) {
    if (!this.gamingPlatforms) {
        this.gamingPlatforms = {
            steam: "",
            xboxLive: "",
            playstationNetwork: "",
            xTwitter: "",
            instagram: "",
            facebook: ""
        };
    }
    // Initialize arrays if they don't exist
    if (!this.favoriteGames) {
        this.favoriteGames = [];
    }
    if (!this.friends) {
        this.friends = [];
    }
    if (!this.friendRequestsSent) {
        this.friendRequestsSent = [];
    }
    if (!this.friendRequestsReceived) {
        this.friendRequestsReceived = [];
    }
    next();
});

//hash passwords
userSchema.pre("save", async function(next){
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
}

const User = mongoose.model("User", userSchema);

export default User;
    