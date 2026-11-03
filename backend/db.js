import "dotenv/config";
import mongoose from "mongoose";


const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.mongo_url);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export default connectDB;