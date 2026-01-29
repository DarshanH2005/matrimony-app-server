/**
 * Matrimony App Server
 *
 * Main entry point for the Indian Matrimony App backend API.
 * This server provides:
 * - User authentication (JWT-based with OTP mock support)
 * - Profile management (biodata, preferences)
 * - Intelligent matching algorithm
 * - Connection request system
 *
 * @author Senior Full Stack Engineer
 * @version 1.0.0
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const connectionRoutes = require("./routes/connection");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");
const path = require("path");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ===================
// MIDDLEWARE
// ===================

// CORS - Allow cross-origin requests (for mobile app)
app.use(
  cors({
    origin: "*", // In production, restrict to your app's domain
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parser - Parse JSON request bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging (development)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
  });
}

// ===================
// ROUTES
// ===================

// Serve admin panel static files
app.use("/admin", express.static(path.join(__dirname, "admin-panel")));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Matrimony App API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      user: "/api/user",
      connection: "/api/connection",
      admin: "/api/admin",
      config: "/api/config",
      adminPanel: "/admin",
    },
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Mount route handlers
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/connection", connectionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);

// ===================
// ERROR HANDLING
// ===================

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    hint: "Check if you're using the correct API endpoint. All API routes start with /api/",
    availableEndpoints: {
      auth: {
        base: "/api/auth",
        routes: [
          "POST /register",
          "POST /login",
          "POST /send-otp",
          "POST /verify-otp",
        ],
      },
      user: {
        base: "/api/user",
        routes: [
          "GET /profile",
          "PUT /profile",
          "PUT /profile/step/:step",
          "GET /recommendations",
          "GET /:id",
        ],
      },
      connection: {
        base: "/api/connection",
        routes: [
          "POST /send",
          "PUT /respond",
          "GET /requests",
          "GET /matches",
          "GET /all",
          "DELETE /:userId",
        ],
      },
      admin: {
        base: "/api/admin",
        routes: [
          "GET /users",
          "PUT /users/:id",
          "DELETE /users/:id",
          "GET /stats",
        ],
      },
      config: {
        base: "/api/config",
        routes: ["GET /broker"],
      },
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ===================
// SERVER STARTUP
// ===================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎉 Matrimony App Server Started Successfully! 🎉         ║
║                                                            ║
║   Environment: ${(process.env.NODE_ENV || "development").padEnd(40)}║
║   Port: ${PORT}║
║   API URL: https://matrimony-app-server.onrender.com       ║
║                                                            ║
║   Endpoints:                                               ║
║   - POST /api/auth/register    (Create account)            ║
║   - POST /api/auth/login       (Login)                     ║
║   - PUT  /api/user/profile     (Update profile)            ║
║   - GET  /api/user/recommendations (Get matches)           ║
║   - POST /api/connection/send  (Send interest)             ║
║   - PUT  /api/connection/respond (Accept/Reject)           ║
║                                                            ║
║   Admin Panel: https://matrimony-app-server.onrender.com/admin ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  // In production, you might want to exit and let PM2 restart
  // process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

module.exports = app;
