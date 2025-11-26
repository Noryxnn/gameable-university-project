import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const migrateUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all users without gamingPlatforms field or with incomplete gamingPlatforms
    const users = await User.find({
      $or: [
        { gamingPlatforms: { $exists: false } },
        { gamingPlatforms: null }
      ]
    });

    console.log(`Found ${users.length} users to migrate`);

    // Update each user
    for (const user of users) {
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
        console.log(`Updated user: ${user.username}`);
      }
    }

    // Also ensure all users have bio and profilePicture fields
    await User.updateMany(
      { bio: { $exists: false } },
      { $set: { bio: "" } }
    );

    await User.updateMany(
      { profilePicture: { $exists: false } },
      { $set: { profilePicture: "" } }
    );

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateUsers();

