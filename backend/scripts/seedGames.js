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
    releaseDate: "September 17, 2013",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
    trailerUrl: "https://www.youtube.com/embed/QkkoHAzjnUs",
    rating: "M",
    reviewScore: 4.8,
    reviewCount: 156000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
    features: ["Open World Exploration", "Multiple Playable Characters", "Online Multiplayer", "Extensive Customization", "Dynamic Weather System"],
    downloadLink: "https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/"
  },
  {
    title: "Cyberpunk 2077",
    developer: "CD Projekt Red",
    genre: "Action RPG",
    description: "Become a cyberpunk mercenary in Night City, a megalopolis obsessed with power, glamour, and body modification. Explore a vast open world and shape your destiny.",
    releaseYear: 2020,
    releaseDate: "December 10, 2020",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2rpf.jpg",
    trailerUrl: "https://www.youtube.com/embed/8X2kIfS6fb8",
    rating: "M",
    reviewScore: 4.5,
    reviewCount: 89000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Screen Reader", "Subtitles"],
    features: ["Character Customization", "Multiple Endings", "Cybernetic Enhancements", "Photo Mode", "Dynamic Night City"],
    downloadLink: "https://store.steampowered.com/app/1091500/Cyberpunk_2077/"
  },
  {
    title: "God of War (2018)",
    developer: "Sony Interactive Entertainment",
    genre: "Action-Adventure",
    description: "Journey through Norse mythology as Kratos and his son Atreus. Experience intense combat, solve environmental puzzles, and uncover a deeply emotional story.",
    releaseYear: 2018,
    releaseDate: "April 20, 2018",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r76.jpg",
    trailerUrl: "https://www.youtube.com/embed/K0u_kAWLJOA",
    rating: "M",
    reviewScore: 4.9,
    reviewCount: 124000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Screen Reader", "Subtitles", "One-Handed Mode"],
    features: ["Norse Mythology Setting", "Father-Son Story", "RPG Elements", "Leviathan Axe Combat", "New Game+"],
    downloadLink: "https://store.steampowered.com/app/1593500/God_of_War/"
  },
  {
    title: "Red Dead Redemption 2",
    developer: "Rockstar Games",
    genre: "Action-Adventure",
    description: "Experience the decline of the outlaw era in this epic tale of honor and loyalty. Explore the vast American frontier in this critically acclaimed open-world adventure.",
    releaseYear: 2018,
    releaseDate: "October 26, 2018",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r6i.jpg",
    trailerUrl: "https://www.youtube.com/embed/eaW0tYpxyp0",
    rating: "M",
    reviewScore: 4.9,
    reviewCount: 178000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
    features: ["Massive Open World", "Deep Story Campaign", "Online Multiplayer", "Hunting & Survival", "Dynamic Honor System"],
    downloadLink: "https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/"
  },
  {
    title: "Fortnite",
    developer: "Epic Games",
    genre: "Battle Royale",
    description: "Join millions of players in the ultimate battle royale experience. Build, fight, and survive in this free-to-play multiplayer game with constant updates and events.",
    releaseYear: 2017,
    releaseDate: "July 25, 2017",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg",
    trailerUrl: "https://www.youtube.com/embed/WJW-bzXZM8M",
    rating: "T",
    reviewScore: 4.3,
    reviewCount: 245000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Voice Control", "Subtitles"],
    features: ["100 Player Battles", "Building Mechanics", "Regular Updates", "Cross-Platform Play", "Creative Mode"],
    downloadLink: "https://www.epicgames.com/fortnite/"
  },
  {
    title: "Minecraft",
    developer: "Mojang Studios",
    genre: "Sandbox",
    description: "Build, explore, and survive in an infinite blocky world. Create anything you can imagine, from simple houses to complex redstone contraptions and massive cities.",
    releaseYear: 2011,
    releaseDate: "November 18, 2011",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co49x5.jpg",
    trailerUrl: "https://www.youtube.com/embed/MmB9b5njVbA",
    rating: "E10+",
    reviewScore: 4.7,
    reviewCount: 320000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Screen Reader", "Subtitles"],
    features: ["Infinite World Generation", "Creative & Survival Modes", "Multiplayer Servers", "Redstone Engineering", "Cross-Platform Play"],
    downloadLink: "https://www.minecraft.net/"
  },
  {
    title: "The Last of Us Part II",
    developer: "Naughty Dog",
    genre: "Action-Adventure",
    description: "Industry-leading accessibility with 60+ options including audio descriptions, enhanced listen mode, high contrast displays, and comprehensive screen reader support.",
    releaseYear: 2020,
    releaseDate: "June 19, 2020",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2r7f.jpg",
    trailerUrl: "https://www.youtube.com/embed/vhII1qlcZ4E",
    rating: "M",
    reviewScore: 4.9,
    reviewCount: 89000,
    accessibilityFeatures: ["Hearing", "Dexterity", "Visual", "Cognitive", "Colorblind", "Voice Control", "Custom Controls", "Subtitles", "One-Handed"],
    features: ["Audio Descriptions", "Navigation Assist", "Enhanced Listen Mode", "Lock-on Aim", "Auto-Pickup", "60+ Settings"],
    downloadLink: "https://www.playstation.com/en-us/games/the-last-of-us-part-ii/"
  },
  {
    title: "Horizon Zero Dawn",
    developer: "Guerrilla Games",
    genre: "Action RPG",
    description: "Explore a lush post-apocalyptic world overrun by robotic creatures. Hunt machines, uncover ancient mysteries, and discover your true purpose.",
    releaseYear: 2017,
    releaseDate: "February 28, 2017",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7a.jpg",
    trailerUrl: "https://www.youtube.com/embed/u4-FCsiF5x4",
    rating: "T",
    reviewScore: 4.6,
    reviewCount: 95000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
    features: ["Machine Hunting", "Crafting System", "Skill Trees", "Photo Mode", "New Game+"],
    downloadLink: "https://store.steampowered.com/app/1151640/Horizon_Zero_Dawn_Complete_Edition/"
  },
  {
    title: "Spider-Man",
    developer: "Insomniac Games",
    genre: "Action-Adventure",
    description: "Swing through New York City as the iconic web-slinger. Fight crime, save the city, and experience an original Spider-Man story.",
    releaseYear: 2018,
    releaseDate: "September 7, 2018",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7b.jpg",
    trailerUrl: "https://www.youtube.com/embed/q4GdJVvdxss",
    rating: "T",
    reviewScore: 4.8,
    reviewCount: 112000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles", "One-Handed Mode"],
    features: ["Web-Swinging Traversal", "Fluid Combat System", "Suit Customization", "Photo Mode", "DLC Story Content"],
    downloadLink: "https://store.steampowered.com/app/1817070/Marvels_SpiderMan_Remastered/"
  },
  {
    title: "The Witcher 3: Wild Hunt",
    developer: "CD Projekt Red",
    genre: "Action RPG",
    description: "Play as Geralt of Rivia, a monster hunter in a vast open world. Make choices that shape the story and explore a rich fantasy universe.",
    releaseYear: 2015,
    releaseDate: "May 19, 2015",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg",
    trailerUrl: "https://www.youtube.com/embed/c0i88t0Kacs",
    rating: "M",
    reviewScore: 4.9,
    reviewCount: 198000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Subtitles"],
    features: ["Branching Storylines", "Monster Hunting", "Alchemy System", "Gwent Card Game", "Massive DLC Expansions"],
    downloadLink: "https://store.steampowered.com/app/292030/The_Witcher_3_Wild_Hunt/"
  },
  {
    title: "Assassin's Creed Valhalla",
    developer: "Ubisoft",
    genre: "Action RPG",
    description: "Lead your Viking clan to glory in 9th century England. Raid, build, and conquer in this epic open-world adventure.",
    releaseYear: 2020,
    releaseDate: "November 10, 2020",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2r7a.jpg",
    trailerUrl: "https://www.youtube.com/embed/ssrNcwxALS4",
    rating: "M",
    reviewScore: 4.4,
    reviewCount: 67000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Colorblind Mode", "Screen Reader", "Subtitles"],
    features: ["Viking Raids", "Settlement Building", "Dual-Wielding Combat", "Mythology Quests", "Photo Mode"],
    downloadLink: "https://store.steampowered.com/app/2208920/Assassins_Creed_Valhalla/"
  },
  {
    title: "Elden Ring",
    developer: "FromSoftware",
    genre: "Action RPG",
    description: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
    releaseYear: 2022,
    releaseDate: "February 25, 2022",
    imageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
    trailerUrl: "https://www.youtube.com/embed/E3Huy2cdih0",
    rating: "M",
    reviewScore: 4.9,
    reviewCount: 145000,
    accessibilityFeatures: ["Full Captions", "Large Target Inputs", "Subtitles"],
    features: ["Open World Exploration", "Challenging Combat", "Character Builds", "Multiplayer Co-op", "George R.R. Martin Lore"],
    downloadLink: "https://store.steampowered.com/app/1245620/ELDEN_RING/"
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
