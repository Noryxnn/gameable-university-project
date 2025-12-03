import mongoose from 'mongoose';
import User from '../models/User.js';

// connect to MongoDB
export const connectDB = async () => {
    try {
        // Check if MONGO_URI is set
        if (!process.env.MONGO_URI) {
            console.error('[ERROR] MONGO_URI is not set in environment variables!');
            console.error('Please check your .env file in the backend directory.');
            throw new Error('MONGO_URI environment variable is missing');
        }

        // Validate it's not pointing to localhost (common mistake)
        if (process.env.MONGO_URI.includes('127.0.0.1') || process.env.MONGO_URI.includes('localhost')) {
            console.error('[ERROR] MONGO_URI appears to be pointing to localhost!');
            console.error('For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/database');
            throw new Error('MONGO_URI should point to MongoDB Atlas, not localhost');
        }

        console.log('[INFO] Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        });
        console.log(`[SUCCESS] MongoDB connected: ${conn.connection.host}`);
        
        // Automatically create admin user if it doesn't exist
        // Wait a moment for connection to be fully ready
        setTimeout(async () => {
            try {
                await createAdminUser();
            } catch (err) {
                console.error('[WARN] Admin user creation failed (non-critical):', err.message);
            }
        }, 2000); // Wait 2 seconds after connection to ensure it's ready
    } catch (err) {
        console.error('[ERROR] MongoDB connection error:', err.message);
        throw err; // Re-throw to let server.js handle it
    }
};

// Create admin user if it doesn't exist
const createAdminUser = async () => {
    try {
        const adminEmail = 'admin@admin.com';
        const adminPassword = 'As123123';
        
        console.log('[INFO] Checking for admin user...');
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            // Check if username 'admin' already exists
            const existingUsername = await User.findOne({ username: 'admin' });
            if (existingUsername && existingUsername.email !== adminEmail) {
                console.log('[WARN] Username "admin" already exists with different email. Creating with username "admin_user"...');
                const admin = await User.create({
                    username: 'admin_user',
                    email: adminEmail,
                    password: adminPassword,
                    isAdmin: true
                });
                console.log('[SUCCESS] Admin user created successfully');
                console.log(`   Username: admin_user`);
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${adminPassword}`);
            } else {
                const admin = await User.create({
                    username: 'admin',
                    email: adminEmail,
                    password: adminPassword,
                    isAdmin: true
                });
                console.log('[SUCCESS] Admin user created successfully');
                console.log(`   Username: admin`);
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${adminPassword}`);
            }
        } else {
            // Update existing user to ensure they're admin
            if (!existingAdmin.isAdmin) {
                existingAdmin.isAdmin = true;
                existingAdmin.password = adminPassword; // Will be hashed by pre-save hook
                await existingAdmin.save();
                console.log('[SUCCESS] Existing user updated to admin');
                console.log(`   Email: ${adminEmail}`);
                console.log(`   Password: ${adminPassword}`);
            } else {
                console.log('[SUCCESS] Admin user already exists');
                console.log(`   Email: ${adminEmail}`);
            }
        }
    } catch (error) {
        // Log error but don't throw - this is non-critical
        console.error('[ERROR] Error creating admin user:', error.message);
        if (error.code === 11000) {
            console.error('   Duplicate key error - username or email already exists');
        }
        // Don't re-throw - we don't want to break the connection
    }
};
