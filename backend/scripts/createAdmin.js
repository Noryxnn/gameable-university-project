import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set in environment variables!');
      console.error('Please create a .env file in the backend directory with:');
      console.error('MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
      process.exit(1);
    }

    // Connect to database
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    
    // Wait a bit for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'As123123';
    
    console.log('🔄 Checking for admin user...');
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      // Check if username 'admin' already exists
      const existingUsername = await User.findOne({ username: 'admin' });
      let username = 'admin';
      if (existingUsername && existingUsername.email !== adminEmail) {
        username = 'admin_user';
        console.log('⚠️  Username "admin" already exists. Using "admin_user" instead...');
      }
      
      const admin = await User.create({
        username: username,
        email: adminEmail,
        password: adminPassword,
        isAdmin: true
      });
      console.log('✅ Admin user created successfully!');
      console.log(`   Username: ${username}`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      // Update existing user to be admin
      if (!existingAdmin.isAdmin) {
        existingAdmin.isAdmin = true;
        existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
        await existingAdmin.save();
        console.log('✅ Existing user updated to admin!');
      } else {
        console.log('✅ Admin user already exists!');
      }
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    }
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.message.includes('MONGO_URI')) {
      console.error('\n💡 Make sure your .env file in the backend directory contains:');
      console.error('MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    }
    process.exit(1);
  }
};

createAdmin();

