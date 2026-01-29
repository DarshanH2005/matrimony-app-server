/**
 * Admin Seed Script
 *
 * Creates default super admin account if none exists.
 *
 * Usage: node scripts/seedAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const DEFAULT_ADMIN = {
  email: "admin@matrimony.com",
  password: "Admin@123",
  name: "Super Admin",
  role: "super_admin",
  permissions: ["users", "connections", "settings", "analytics", "admins"],
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if any admin exists
    const existingAdmin = await Admin.findOne({ role: "super_admin" });

    if (existingAdmin) {
      console.log("Super admin already exists:");
      console.log(`  Email: ${existingAdmin.email}`);
      console.log("  Skipping seed...");
    } else {
      // Create default admin
      const admin = new Admin(DEFAULT_ADMIN);
      await admin.save();

      console.log("\n✅ Default super admin created successfully!");
      console.log("=====================================");
      console.log(`  Email:    ${DEFAULT_ADMIN.email}`);
      console.log(`  Password: ${DEFAULT_ADMIN.password}`);
      console.log(`  Role:     ${DEFAULT_ADMIN.role}`);
      console.log("=====================================");
      console.log("\n⚠️  Please change the password after first login!");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedAdmin();
