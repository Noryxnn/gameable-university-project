import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from './routes/auth.js'
import { connectDB } from "./config/db.js";

dotenv.config(); // load environment variables
const app = express(); // create express app


// middleware
app.use(cors());
app.use(express.json());

//
app.use("/api/users", authRoutes)


// connect to MongoDB
connectDB(); 

// start the server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));