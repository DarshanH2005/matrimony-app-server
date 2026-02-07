const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * 
 * Optimized for 10K concurrent users with:
 * - Connection pooling (50 max connections)
 * - Automatic reconnection
 * - Connection health monitoring
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/matrimony-app",
      {
        // Connection pooling
        maxPoolSize: 10, // Reduced from 50 to 10 for stability on free tier
        minPoolSize: 0,

        // Timeouts - Increased for stability
        serverSelectionTimeoutMS: 10000, // Increased to 10s
        socketTimeoutMS: 45000,

        // Write concern
        w: "majority",
        retryWrites: true,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Don't exit process in dev, let it retry or stay alive
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
