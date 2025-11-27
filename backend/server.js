import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from './routes/auth.js'
import gamesRoutes from './routes/games.js'
import gameRequestsRoutes from './routes/gameRequests.js'
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // load environment variables
const app = express(); // create express app


// middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route to test server
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend server is running",
    endpoints: {
      health: "/api/health",
      test: "/api/users/test"
    }
  });
});

// Debug middleware to log all API requests
app.use("/api", (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route (must be before other routes)
app.get("/api/health", (req, res) => {
  console.log("Health check route hit!");
  res.status(200).json({ 
    status: "ok", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/users", authRoutes)
app.use("/api/games", gamesRoutes)
app.use("/api/game-requests", gameRequestsRoutes)

// 404 handler for API routes (must be last)
// Express 5 doesn't support /api/* pattern, so we catch all unmatched /api routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ 
      message: `Route ${req.method} ${req.originalUrl} not found`,
      availableRoutes: [
        "GET /api/health",
        "POST /api/users/register",
        "POST /api/users/login",
        "GET /api/users/me",
        "PUT /api/users/profile",
        "POST /api/users/profile/upload",
        "GET /api/users/test",
        "POST /api/game-requests",
        "GET /api/game-requests"
      ]
    });
  } else {
    next();
  }
});

// Start the server first (don't wait for MongoDB)
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test route: http://localhost:${PORT}/api/users/test`);
});

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
  console.error("MongoDB connection error (server will continue running):", err.message);
});