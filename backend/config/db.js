import mongoose from 'mongoose';

// connect to MongoDB
export const connectDB = async () => {
    try{ 
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.log(err) // log the error
        process.exit(1); // exit with failure
    }
};
