import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/exchangeskill";
  try {
    console.log("Connecting to MONGODB_URI:", uri);
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
