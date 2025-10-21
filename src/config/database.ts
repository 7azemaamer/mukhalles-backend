import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/mukhalis";

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);

    logger.info("MongoDB Connected Successfully");

    // MongoDB connection event listeners
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    throw error;
  }
};

export default connectDB;
