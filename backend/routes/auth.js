import express from "express";
import passport from "passport";
import { googleOAuthEnabled } from "../config/passport.js";
import User from "../models/User.js";
import Game from "../models/Game.js";
import { protect, admin } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import upload from "../middleware/upload.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
      // Check if account was created with Google OAuth
      if (userExists.authProvider === "google") {
        return res.status(400).json({ 
          message: "An account with this email already exists. Please sign in with Google." 
        });
      }
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ username, email, password, authProvider: "local" });
    const token = generateToken(user._id);
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
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

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user signed up with Google OAuth
    if (user.authProvider === "google" || !user.password) {
      return res.status(401).json({ 
        message: "This account was created with Google. Please sign in with Google." 
      });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned. Please contact support." });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || false,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to check if Google OAuth is configured and enabled
const checkGoogleOAuth = (req, res, next) => {
  if (!googleOAuthEnabled) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
  }
  next();
};

// Google OAuth - Initiate authentication
router.get("/auth/google", checkGoogleOAuth, passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth - Callback handler
router.get(
  "/auth/google/callback",
  checkGoogleOAuth,
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      const user = req.user;

      // Check if user is banned
      if (user.isBanned) {
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=account_banned`);
      }

      // Generate JWT token
      const token = generateToken(user._id);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/auth/google/callback?token=${token}`);
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=server_error`);
    }
  }
);

// Me
router.get("/me", protect, async (req, res) => {
  try {
    // Ensure user has all required fields
    const user = await User.findById(req.user._id);
    
    // Check if user is banned (double check even though protect middleware checks)
    if (user.isBanned) {
      return res.status(403).json({ 
        message: "Your account has been banned. Please contact support.",
        banned: true 
      });
    }
    
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

// Get all users (admin only)
router.get("/all", protect, admin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .select("username email bio profilePicture favoriteGames isAdmin isBanned createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Search users
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;
    
    // If admin and empty query, return all users
    if (req.user.isAdmin && (!q || q.trim() === "")) {
      const users = await User.find({})
        .select("-password")
        .select("username email bio profilePicture favoriteGames isAdmin isBanned createdAt")
        .sort({ createdAt: -1 })
        .limit(100);
      return res.status(200).json({ users });
    }

    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ],
      _id: { $ne: req.user._id }
    })
    .select("username email bio profilePicture favoriteGames isAdmin isBanned createdAt")
    .limit(100);

    res.status(200).json({ users });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get friends list (must come before /:userId)
router.get("/friends/list", protect, async (req, res) => {
  try {
    console.log("GET /api/users/friends/list route hit");
    const user = await User.findById(req.user._id)
      .populate("friends", "username email bio profilePicture favoriteGames")
      .populate("friendRequestsReceived", "username email bio profilePicture")
      .populate("friendRequestsSent", "username email bio profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      friends: user.friends || [],
      receivedRequests: user.friendRequestsReceived || [],
      sentRequests: user.friendRequestsSent || []
    });
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send friend request
router.post("/friends/request/:userId", protect, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    if (currentUser.friendRequestsSent.includes(targetUserId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if request already received
    if (currentUser.friendRequestsReceived.includes(targetUserId)) {
      return res.status(400).json({ message: "This user has already sent you a friend request" });
    }

    // Add to sent requests
    currentUser.friendRequestsSent.push(targetUserId);
    await currentUser.save();

    // Add to received requests of target user
    targetUser.friendRequestsReceived.push(req.user._id);
    await targetUser.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Send friend request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept friend request
router.post("/friends/accept/:userId", protect, async (req, res) => {
  try {
    const senderUserId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    const senderUser = await User.findById(senderUserId);

    if (!senderUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request exists
    if (!currentUser.friendRequestsReceived.includes(senderUserId)) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    // Remove from received requests
    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      id => id.toString() !== senderUserId
    );
    // Add to friends
    if (!currentUser.friends.includes(senderUserId)) {
      currentUser.friends.push(senderUserId);
    }
    await currentUser.save();

    // Remove from sent requests of sender
    senderUser.friendRequestsSent = senderUser.friendRequestsSent.filter(
      id => id.toString() !== req.user._id.toString()
    );
    // Add to friends of sender
    if (!senderUser.friends.includes(req.user._id)) {
      senderUser.friends.push(req.user._id);
    }
    await senderUser.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Accept friend request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Decline friend request
router.post("/friends/decline/:userId", protect, async (req, res) => {
  try {
    const senderUserId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    const senderUser = await User.findById(senderUserId);

    if (!senderUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from received requests
    currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
      id => id.toString() !== senderUserId
    );
    await currentUser.save();

    // Remove from sent requests of sender
    senderUser.friendRequestsSent = senderUser.friendRequestsSent.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await senderUser.save();

    res.status(200).json({ message: "Friend request declined" });
  } catch (err) {
    console.error("Decline friend request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove friend
router.delete("/friends/:userId", protect, async (req, res) => {
  try {
    const friendUserId = req.params.userId;
    const currentUser = await User.findById(req.user._id);
    const friendUser = await User.findById(friendUserId);

    if (!friendUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from friends list
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== friendUserId
    );
    await currentUser.save();

    // Remove from friends list of friend
    friendUser.friends = friendUser.friends.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await friendUser.save();

    res.status(200).json({ message: "Friend removed" });
  } catch (err) {
    console.error("Remove friend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's favorites
router.get("/favorites", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Populate favorite games
    await user.populate("favoriteGames", "title developer genre description releaseYear releaseDate imageUrl trailerUrl rating reviewScore reviewCount accessibilityFeatures features downloadLink");

    res.status(200).json({ favorites: user.favoriteGames || [] });
  } catch (err) {
    console.error("Get favorites error:", err);
    console.error("Error details:", err.stack);
    res.status(500).json({ 
      message: err.message || "Server error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Add game to favorites
router.post("/favorites/:gameId", protect, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Validate gameId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if game is already in favorites (compare as strings)
    const isAlreadyFavorite = user.favoriteGames.some(
      favId => favId.toString() === gameId
    );
    if (isAlreadyFavorite) {
      return res.status(400).json({ message: "Game already in favorites" });
    }

    // Add game to favorites
    user.favoriteGames.push(gameId);
    await user.save();

    // Populate and return the updated favorites
    await user.populate("favoriteGames", "title developer genre description releaseYear releaseDate imageUrl trailerUrl rating reviewScore reviewCount accessibilityFeatures features downloadLink");

    res.status(200).json({ 
      message: "Game added to favorites",
      favorites: user.favoriteGames 
    });
  } catch (err) {
    console.error("Add favorite error:", err);
    console.error("Error details:", err.stack);
    res.status(500).json({ 
      message: err.message || "Server error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Remove game from favorites
router.delete("/favorites/:gameId", protect, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Validate gameId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: "Invalid game ID" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if game is in favorites
    const isInFavorites = user.favoriteGames.some(
      favId => favId.toString() === gameId
    );
    if (!isInFavorites) {
      return res.status(400).json({ message: "Game is not in favorites" });
    }

    // Remove game from favorites
    user.favoriteGames = user.favoriteGames.filter(
      id => id.toString() !== gameId
    );
    await user.save();

    res.status(200).json({ 
      message: "Game removed from favorites",
      favorites: user.favoriteGames 
    });
  } catch (err) {
    console.error("Remove favorite error:", err);
    console.error("Error details:", err.stack);
    res.status(500).json({ 
      message: err.message || "Server error",
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Forgot Password (must come before /:userId route)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide an email address" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: "If that email exists, a password reset link has been sent" 
      });
    }

    // Check if user signed up with Google OAuth
    if (user.authProvider === "google" || !user.password) {
      // Don't reveal the exact reason for security, but don't send email
      return res.status(200).json({ 
        message: "If that email exists, a password reset link has been sent" 
      });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file");
      return res.status(500).json({ 
        message: "Email service is not configured. Please contact support." 
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email content
    const message = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset Request - GameAble',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9333ea;">Password Reset Request</h2>
          <p>You requested to reset your password for your GameAble account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Reset Password
          </a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            ${resetUrl}
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(message);
      res.status(200).json({ 
        message: "If that email exists, a password reset link has been sent" 
      });
    } catch (emailError) {
      console.error("Email error details:", {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response,
        command: emailError.command
      });
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      // Provide more helpful error message in development
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Email could not be sent: ${emailError.message}. Check SMTP configuration.`
        : "Email could not be sent. Please try again later.";
      
      return res.status(500).json({ 
        message: errorMessage 
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a new password" });
    }

    // Hash token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and check if token hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin routes - User management (must come before GET /:userId)
// PUT /api/users/:userId/ban - Ban a user (admin only)
router.put("/:userId/ban", protect, admin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent banning admins
    if (targetUser.isAdmin) {
      return res.status(400).json({ message: "Cannot ban admin users" });
    }

    // Prevent banning yourself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot ban yourself" });
    }

    targetUser.isBanned = true;
    await targetUser.save();

    res.status(200).json({ 
      message: "User banned successfully",
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        isBanned: targetUser.isBanned
      }
    });
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:userId/unban - Unban a user (admin only)
router.put("/:userId/unban", protect, admin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    targetUser.isBanned = false;
    await targetUser.save();

    res.status(200).json({ 
      message: "User unbanned successfully",
      user: {
        _id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        isBanned: targetUser.isBanned
      }
    });
  } catch (err) {
    console.error("Unban user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:userId - Delete a user (admin only)
router.delete("/:userId", protect, admin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting admins
    if (targetUser.isAdmin) {
      return res.status(400).json({ message: "Cannot delete admin users" });
    }

    // Prevent deleting yourself
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.status(200).json({ 
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile by ID (must come after all specific routes)
router.get("/:userId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("favoriteGames", "title developer genre description releaseYear imageUrl rating accessibilityFeatures");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export default router;