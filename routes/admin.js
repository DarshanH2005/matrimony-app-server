/**
 * Admin Routes
 *
 * Handles:
 * - Admin authentication (login, logout, profile)
 * - User management (CRUD, verify, ban)
 * - Connection management
 * - Analytics/Statistics
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const {
  verifyAdminToken,
  requirePermission,
  requireRole,
} = require("../middleware/adminAuth");

const router = express.Router();

// ===================
// AUTHENTICATION
// ===================

/**
 * POST /api/admin/login
 * Admin login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      const lockMinutes = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Account locked. Try again in ${lockMinutes} minutes.`,
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact super admin.",
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    await admin.updateOne({
      $set: { loginAttempts: 0, lastLogin: new Date() },
      $unset: { lockUntil: 1 },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, type: "admin", role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions,
        },
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

/**
 * GET /api/admin/profile
 * Get current admin profile
 */
router.get("/profile", verifyAdminToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      admin: req.admin,
    },
  });
});

/**
 * PUT /api/admin/change-password
 * Change admin password
 */
router.put("/change-password", verifyAdminToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ===================
// STATISTICS
// ===================

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get(
  "/stats",
  verifyAdminToken,
  requirePermission("analytics"),
  async (req, res) => {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get counts
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersToday,
        newUsersThisMonth,
        completeProfiles,
        maleUsers,
        femaleUsers,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: thisMonth } }),
        User.countDocuments({ isProfileComplete: true }),
        User.countDocuments({ "basicInfo.gender": "male" }),
        User.countDocuments({ "basicInfo.gender": "female" }),
      ]);

      // Get connection stats
      const connectionStats = await User.aggregate([
        { $unwind: "$connectionRequests" },
        {
          $group: {
            _id: "$connectionRequests.status",
            count: { $sum: 1 },
          },
        },
      ]);

      const connections = {
        pending: 0,
        accepted: 0,
        rejected: 0,
      };
      connectionStats.forEach((stat) => {
        connections[stat._id] = stat.count;
      });

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            active: activeUsers,
            verified: verifiedUsers,
            newToday: newUsersToday,
            newThisMonth: newUsersThisMonth,
            completeProfiles,
            male: maleUsers,
            female: femaleUsers,
          },
          connections,
        },
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// ===================
// USER MANAGEMENT
// ===================

/**
 * GET /api/admin/users
 * List all users with pagination and filters
 */
router.get(
  "/users",
  verifyAdminToken,
  requirePermission("users"),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = {};

      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");
        filter.$or = [
          { email: searchRegex },
          { "basicInfo.name": searchRegex },
          { phone: searchRegex },
        ];
      }

      if (req.query.isVerified) {
        filter.isVerified = req.query.isVerified === "true";
      }

      if (req.query.isActive) {
        filter.isActive = req.query.isActive === "true";
      }

      if (req.query.gender) {
        filter["basicInfo.gender"] = req.query.gender;
      }

      if (req.query.isProfileComplete) {
        filter.isProfileComplete = req.query.isProfileComplete === "true";
      }

      // Get users
      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-password -connectionRequests")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * GET /api/admin/users/:id
 * Get single user details
 */
router.get(
  "/users/:id",
  verifyAdminToken,
  requirePermission("users"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * PUT /api/admin/users/:id
 * Update user details
 */
router.put(
  "/users/:id",
  verifyAdminToken,
  requirePermission("users"),
  async (req, res) => {
    try {
      const allowedUpdates = [
        "basicInfo",
        "culturalInfo",
        "careerInfo",
        "familyInfo",
        "isActive",
        "isVerified",
        "isProfileComplete",
      ];

      const updates = {};
      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        data: { user },
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * PUT /api/admin/users/:id/verify
 * Verify a user
 */
router.put(
  "/users/:id/verify",
  verifyAdminToken,
  requirePermission("users"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { isVerified: true } },
        { new: true },
      ).select("-password -connectionRequests");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User verified successfully",
        data: { user },
      });
    } catch (error) {
      console.error("Verify user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * PUT /api/admin/users/:id/ban
 * Ban or unban a user
 */
router.put(
  "/users/:id/ban",
  verifyAdminToken,
  requirePermission("users"),
  async (req, res) => {
    try {
      const { ban } = req.body; // true to ban, false to unban

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: !ban } },
        { new: true },
      ).select("-password -connectionRequests");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: ban
          ? "User banned successfully"
          : "User unbanned successfully",
        data: { user },
      });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete(
  "/users/:id",
  verifyAdminToken,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Also remove this user from other users' connection requests
      await User.updateMany(
        { "connectionRequests.userId": req.params.id },
        { $pull: { connectionRequests: { userId: req.params.id } } },
      );

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// ===================
// CONNECTION MANAGEMENT
// ===================

/**
 * GET /api/admin/connections
 * List all connections
 */
router.get(
  "/connections",
  verifyAdminToken,
  requirePermission("connections"),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;
      const status = req.query.status; // pending, accepted, rejected

      const pipeline = [
        { $unwind: "$connectionRequests" },
        { $match: { "connectionRequests.type": "sent" } },
      ];

      if (status) {
        pipeline.push({ $match: { "connectionRequests.status": status } });
      }

      pipeline.push(
        { $sort: { "connectionRequests.createdAt": -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "connectionRequests.userId",
            foreignField: "_id",
            as: "recipient",
          },
        },
        { $unwind: { path: "$recipient", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            sender: {
              _id: "$_id",
              email: "$email",
              name: "$basicInfo.name",
            },
            recipient: {
              _id: "$recipient._id",
              email: "$recipient.email",
              name: "$recipient.basicInfo.name",
            },
            status: "$connectionRequests.status",
            message: "$connectionRequests.message",
            createdAt: "$connectionRequests.createdAt",
            respondedAt: "$connectionRequests.respondedAt",
          },
        },
      );

      const connections = await User.aggregate(pipeline);

      // Get total count
      const countPipeline = [
        { $unwind: "$connectionRequests" },
        { $match: { "connectionRequests.type": "sent" } },
      ];
      if (status) {
        countPipeline.push({ $match: { "connectionRequests.status": status } });
      }
      countPipeline.push({ $count: "total" });

      const countResult = await User.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      res.json({
        success: true,
        data: {
          connections,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("List connections error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

// ===================
// ADMIN MANAGEMENT (Super Admin Only)
// ===================

/**
 * GET /api/admin/admins
 * List all admins
 */
router.get(
  "/admins",
  verifyAdminToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const admins = await Admin.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: { admins },
      });
    } catch (error) {
      console.error("List admins error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * POST /api/admin/admins
 * Create new admin
 */
router.post(
  "/admins",
  verifyAdminToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: "Email, password, and name are required",
        });
      }

      // Check if admin exists
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin with this email already exists",
        });
      }

      // Get default permissions for role
      const permissions = Admin.getDefaultPermissions(role || "admin");

      const admin = new Admin({
        email: email.toLowerCase(),
        password,
        name,
        role: role || "admin",
        permissions,
      });

      await admin.save();

      res.status(201).json({
        success: true,
        message: "Admin created successfully",
        data: {
          admin: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            permissions: admin.permissions,
          },
        },
      });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

/**
 * DELETE /api/admin/admins/:id
 * Delete an admin
 */
router.delete(
  "/admins/:id",
  verifyAdminToken,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      // Prevent deleting yourself
      if (req.params.id === req.admin._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      const admin = await Admin.findByIdAndDelete(req.params.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.json({
        success: true,
        message: "Admin deleted successfully",
      });
    } catch (error) {
      console.error("Delete admin error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
);

module.exports = router;
