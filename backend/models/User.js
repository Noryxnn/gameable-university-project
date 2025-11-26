import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// user schema for the database
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    gamingPlatforms: {
        steam: { type: String, default: "" },
        xboxLive: { type: String, default: "" },
        playstationNetwork: { type: String, default: "" },
        xTwitter: { type: String, default: "" },
        instagram: { type: String, default: "" },
        facebook: { type: String, default: "" }
    }
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

const User = mongoose.model("User", userSchema);

export default User;
    