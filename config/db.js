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
        // Connection pooling for high concurrency
        maxPoolSize: 50, // Max 50 connections in pool
        minPoolSize: 10, // Keep 10 connections warm

        // Timeouts
        serverSelectionTimeoutMS: 5000, // Fail fast if no server
        socketTimeoutMS: 45000, // Close sockets after 45s inactivity

        // Write concern for reliability
        w: "majority",

        // Retry writes on transient errors
        retryWrites: true,
      },
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
    process.exit(1);
  }
};

module.exports = connectDB;
