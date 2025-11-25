import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../models/Game.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const games = [
  {
    title: "Grand Theft Auto V",
    developer: "Rockstar Games",
    genre: "Action-Adventure",
    description: "Experience Los Santos in this open-world action game. Play through an epic story following three criminals, or explore the vast city with complete freedom.",
    releaseYear: 2013,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "Cyberpunk 2077",
    developer: "CD Projekt Red",
    genre: "Action RPG",
    description: "Become a cyberpunk mercenary in Night City, a megalopolis obsessed with power, glamour, and body modification. Explore a vast open world and shape your destiny.",
    releaseYear: 2020,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "God of War (2018)",
    developer: "Sony Interactive Entertainment",
    genre: "Action-Adventure",
    description: "Journey through Norse mythology as Kratos and his son Atreus. Experience intense combat, solve environmental puzzles, and uncover a deeply emotional story.",
    releaseYear: 2018,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r76.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Screen Reader"]
  },
  {
    title: "Red Dead Redemption 2",
    developer: "Rockstar Games",
    genre: "Action-Adventure",
    description: "Experience the decline of the outlaw era in this epic tale of honor and loyalty. Explore the vast American frontier in this critically acclaimed open-world adventure.",
    releaseYear: 2018,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r6i.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "Fortnite",
    developer: "Epic Games",
    genre: "Battle Royale",
    description: "Join millions of players in the ultimate battle royale experience. Build, fight, and survive in this free-to-play multiplayer game with constant updates and events.",
    releaseYear: 2017,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg",
    rating: "T",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "Minecraft",
    developer: "Mojang Studios",
    genre: "Sandbox",
    description: "Build, explore, and survive in an infinite blocky world. Create anything you can imagine, from simple houses to complex redstone contraptions and massive cities.",
    releaseYear: 2011,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg",
    rating: "E10+",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "The Last of Us Part II",
    developer: "Naughty Dog",
    genre: "Action-Adventure",
    description: "Embark on a journey through a post-apocalyptic America in this emotionally charged story of survival, revenge, and redemption.",
    releaseYear: 2020,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2r7f.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Screen Reader"]
  },
  {
    title: "Horizon Zero Dawn",
    developer: "Guerrilla Games",
    genre: "Action RPG",
    description: "Explore a lush post-apocalyptic world overrun by robotic creatures. Hunt machines, uncover ancient mysteries, and discover your true purpose.",
    releaseYear: 2017,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7a.jpg",
    rating: "T",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "Spider-Man",
    developer: "Insomniac Games",
    genre: "Action-Adventure",
    description: "Swing through New York City as the iconic web-slinger. Fight crime, save the city, and experience an original Spider-Man story.",
    releaseYear: 2018,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7b.jpg",
    rating: "T",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "The Witcher 3: Wild Hunt",
    developer: "CD Projekt Red",
    genre: "Action RPG",
    description: "Play as Geralt of Rivia, a monster hunter in a vast open world. Make choices that shape the story and explore a rich fantasy universe.",
    releaseYear: 2015,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "Assassin's Creed Valhalla",
    developer: "Ubisoft",
    genre: "Action RPG",
    description: "Lead your Viking clan to glory in 9th century England. Raid, build, and conquer in this epic open-world adventure.",
    releaseYear: 2020,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2r7a.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  },
  {
    title: "Elden Ring",
    developer: "FromSoftware",
    genre: "Action RPG",
    description: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
    releaseYear: 2022,
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
    rating: "M",
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode"]
  }
];

const seedGames = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing games
    await Game.deleteMany({});
    console.log('Cleared existing games');

    // Insert new games
    await Game.insertMany(games);
    console.log(`Seeded ${games.length} games successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding games:', error);
    process.exit(1);
  }
};

seedGames();

