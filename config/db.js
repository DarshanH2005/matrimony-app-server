const mongoose = require("mongoose");

/**
 * Connect to MongoDB database
 * Uses the MONGO_URI environment variable or defaults to local MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/matrimony-app",
      {
        // Mongoose 8 no longer requires these options, but keeping for clarity
      },
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
