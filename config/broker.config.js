/**
 * Broker Configuration
 *
 * This file contains all customizable settings for each broker deployment.
 * Modify these values when setting up for a new broker.
 */

module.exports = {
  // ===================
  // BROKER IDENTITY
  // ===================
  broker: {
    name: "Lagnam - Decided by Destiny", // Owner: Veeresh H | Smartspacetechnologies | +919902847517
    tagline: "Decided by Destiny", // Short tagline
    phone: "+919902847517", // Owner's phone number
    whatsapp: "+919902847517", // WhatsApp number (with country code)
    email: "contact@example.com",
    address: "Your City, State",
  },

  // ===================
  // BRANDING
  // ===================
  branding: {
    // Logo URL (relative to assets or absolute URL)
    logo: "/assets/logo.png",

    // Color scheme
    colors: {
      primary: "#E91E63", // Main accent color (pink)
      secondary: "#FFD700", // Secondary color (gold)
      background: "#0A0A0F", // Dark background
      card: "#1A1A24", // Card background
      text: "#FFFFFF", // Primary text
      textSecondary: "#A0A0B0", // Secondary text
      success: "#4CAF50",
      error: "#FF5252",
      warning: "#FF9800",
    },
  },

  // ===================
  // APP SETTINGS
  // ===================
  app: {
    // Default language: 'en', 'hi', 'kn'
    defaultLanguage: "en",

    // Available languages
    languages: ["en", "hi", "kn"],

    // Minimum age for registration
    minAge: 18,

    // Maximum age for registration
    maxAge: 60,
  },

  // ===================
  // FEATURES
  // ===================
  features: {
    // Enable OTP login
    otpLogin: true,

    // Enable WhatsApp sharing
    whatsappShare: true,

    // Show broker contact on profiles
    showBrokerContact: true,

    // Allow direct client-to-client chat
    directChat: false, // Usually false - broker controls communication
  },

  // ===================
  // SERVER CONFIG
  // ===================
  server: {
    // API base URL (will be set per deployment)
    apiUrl: process.env.API_URL || "http://localhost:5000",

    // Admin panel path
    adminPath: "/admin",
  },
};
