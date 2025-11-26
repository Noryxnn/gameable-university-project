import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import upload from "../middleware/upload.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Test route to verify router is working (placed first to ensure it's registered)
router.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.status(200).json({ 
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
    routes: [
      "POST /api/users/register",
      "POST /api/users/login", 
      "GET /api/users/me",
      "PUT /api/users/profile",
      "POST /api/users/profile/upload"
    ]
  });
});

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Me
router.get("/me", protect, async (req, res) => {
  try {
    // Ensure user has all required fields
    const user = await User.findById(req.user._id);
    if (!user.gamingPlatforms) {
      user.gamingPlatforms = {
        steam: "",
        xboxLive: "",
        playstationNetwork: "",
        xTwitter: "",
        instagram: "",
        facebook: ""
      };
      await user.save();
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error in /me route:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Profile (must come before /profile/upload to avoid route conflicts)
router.put("/profile", protect, async (req, res) => {
  try {
    console.log("PUT /profile route hit");
    const { username, bio, profilePicture, gamingPlatforms } = req.body;
    console.log("Request body:", { username, bio, profilePicture, gamingPlatforms });
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log("User not found:", req.user._id);
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate and update username only if provided and not empty
    if (username !== undefined && username !== null && username.trim() !== "") {
      if (username !== user.username) {
        // Check if username is already taken
        const usernameExists = await User.findOne({ username: username.trim(), _id: { $ne: req.user._id } });
        if (usernameExists) {
          return res.status(400).json({ message: "Username already taken" });
        }
        user.username = username.trim();
      }
    } else if (username !== undefined && username.trim() === "") {
      return res.status(400).json({ message: "Username cannot be empty" });
    }
    
    // Update bio
    if (bio !== undefined) {
      user.bio = bio;
    }
    
    // Update profile picture
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }
    
    // Initialize gamingPlatforms if it doesn't exist
    if (!user.gamingPlatforms) {
      user.gamingPlatforms = {
        steam: "",
        xboxLive: "",
        playstationNetwork: "",
        xTwitter: "",
        instagram: "",
        facebook: ""
      };
    }
    
    // Update gaming platforms
    if (gamingPlatforms) {
      if (gamingPlatforms.steam !== undefined) user.gamingPlatforms.steam = gamingPlatforms.steam || "";
      if (gamingPlatforms.xboxLive !== undefined) user.gamingPlatforms.xboxLive = gamingPlatforms.xboxLive || "";
      if (gamingPlatforms.playstationNetwork !== undefined) user.gamingPlatforms.playstationNetwork = gamingPlatforms.playstationNetwork || "";
      if (gamingPlatforms.xTwitter !== undefined) user.gamingPlatforms.xTwitter = gamingPlatforms.xTwitter || "";
      if (gamingPlatforms.instagram !== undefined) user.gamingPlatforms.instagram = gamingPlatforms.instagram || "";
      if (gamingPlatforms.facebook !== undefined) user.gamingPlatforms.facebook = gamingPlatforms.facebook || "";
    }
    
    const updatedUser = await user.save();
    console.log("Profile updated successfully");
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Profile update error:", err);
    // Return more specific error messages
    if (err.name === 'ValidationError') {
      const errorMessages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: errorMessages || err.message });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Upload profile picture
router.post("/profile/upload", protect, upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if it exists and is a local file
    if (user.profilePicture && user.profilePicture.startsWith("/uploads/")) {
      const oldFilePath = path.join(__dirname, "..", user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Save the file path
    const filePath = `/uploads/${req.file.filename}`;
    user.profilePicture = filePath;
    await user.save();

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: filePath,
    });
  } catch (err) {
    console.error("Upload error:", err);
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export default router;