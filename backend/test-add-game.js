// Simple test script to add a game to the database
// Run with: node test-add-game.js

import axios from 'axios';

const newGame = {
  title: "Test Game",
  developer: "Test Developer",
  genre: "Action",
  description: "This is a test game description to verify the database connection works.",
  releaseYear: 2024,
  imageUrl: "https://via.placeholder.com/400x300/6B21A8/FFFFFF?text=Test+Game",
  rating: "E",
  accessibilityFeatures: ["Full Captions", "Large Target Inputs"]
};

async function addGame() {
  try {
    const response = await axios.post('http://localhost:5050/api/games', newGame);
    console.log('✅ Game added successfully!');
    console.log('Game ID:', response.data._id);
    console.log('Game Title:', response.data.title);
  } catch (error) {
    console.error('❌ Error adding game:', error.response?.data || error.message);
  }
}

addGame();

