const express = require("express");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { getRecommendations } = require("../utils/matchingAlgorithm");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

/**
 * @route   POST /api/user/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
  "/profile-photo",
  auth,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Upload to Cloudinary
      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "matrimony/profiles",
        public_id: `user_${req.user.id}`,
        overwrite: true,
        transformation: [
          { width: 500, height: 500, crop: "fill", gravity: "face" },
        ],
      });

      // Update user
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { profilePhoto: result.secure_url },
        { new: true },
      ).select("-password");

      res.json({
        success: true,
        message: "Photo uploaded successfully",
        data: {
          profilePhoto: result.secure_url,
        },
      });
    } catch (error) {
      console.error("Upload photo error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while uploading photo",
      });
    }
  },
);

/**
 * @route   POST /api/user/photos
 * @desc    Upload a photo to gallery (max 4)
 * @access  Private
 */
router.post("/photos", auth, upload.single("photo"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.photos && user.photos.length >= 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum 4 photos allowed",
      });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "matrimony/gallery",
      public_id: `user_${req.user.id}_${Date.now()}`,
      overwrite: true,
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    });

    user.photos.push(result.secure_url);
    await user.save();

    res.json({
      success: true,
      message: "Photo uploaded",
      data: user.photos,
    });
  } catch (error) {
    console.error("Gallery upload error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route   DELETE /api/user/photos
 * @desc    Delete a photo from gallery
 * @access  Private
 */
router.delete("/photos", auth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl)
      return res
        .status(400)
        .json({ success: false, message: "Photo URL required" });

    const user = await User.findById(req.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.photos) {
      user.photos = user.photos.filter((url) => url !== photoUrl);
      await user.save();
    }

    res.json({
      success: true,
      message: "Photo deleted",
      data: user.photos,
    });
  } catch (error) {
    console.error("Gallery delete error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route   GET /api/user/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile (biodata and preferences)
 * @access  Private
 */
router.put("/profile", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = [
      "basicInfo",
      "culturalInfo",
      "careerInfo",
      "familyInfo",
      "partnerPreferences",
      "about",
      "profilePhoto",
    ];

    // Build update object
    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        if (
          typeof updates[field] === "object" &&
          !Array.isArray(updates[field])
        ) {
          // Merge nested objects to avoid overwriting entire objects
          updateData[field] = updates[field];
        } else {
          updateData[field] = updates[field];
        }
      }
    });

    // Check if profile is complete
    const isProfileComplete = checkProfileComplete(updates);
    updateData.isProfileComplete = isProfileComplete;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
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
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
});

/**
 * @route   PUT /api/user/profile/step/:step
 * @desc    Update profile data for a specific onboarding step
 * @access  Private
 */
router.put("/profile/step/:step", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const step = req.params.step;
    const stepData = req.body;

    let updateField;
    switch (step) {
      case "1":
      case "basic":
        updateField = "basicInfo";
        break;
      case "2":
      case "cultural":
        updateField = "culturalInfo";
        break;
      case "3":
      case "career":
        updateField = "careerInfo";
        break;
      case "4":
      case "family":
        updateField = "familyInfo";
        break;
      case "5":
      case "preferences":
        updateField = "partnerPreferences";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid step parameter",
        });
    }

    const updateData = { [updateField]: stepData };

    // If this is the preferences step, mark profile as complete
    if (step === "5" || step === "preferences") {
      updateData.isProfileComplete = true;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
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
      message: `Step ${step} saved successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Update step error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating step",
    });
  }
});

/**
 * @route   GET /api/user/recommendations
 * @desc    Get recommended profiles based on partner preferences
 * @access  Private
 */
router.get("/recommendations", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, ...filters } = req.query;

    // Get recommendations using matching algorithm
    const recommendations = await getRecommendations(
      userId,
      filters,
      parseInt(page),
      parseInt(limit),
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recommendations",
    });
  }
});

/**
 * @route   GET /api/user/:id
 * @desc    Get another user's public profile
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -connectionRequests",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        message: "This profile is no longer active",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
});

/**
 * Helper function to check if profile is complete
 */
function checkProfileComplete(userData) {
  const basicInfo = userData.basicInfo || {};
  const culturalInfo = userData.culturalInfo || {};
  const careerInfo = userData.careerInfo || {};

  // Check minimum required fields
  const hasBasicInfo = basicInfo.name && basicInfo.age && basicInfo.gender;
  const hasCulturalInfo = culturalInfo.religion;
  const hasCareerInfo = careerInfo.education || careerInfo.profession;

  return !!(hasBasicInfo && hasCulturalInfo && hasCareerInfo);
}

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete("/account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete profile photo from Cloudinary if exists
    if (user.profilePhoto && user.profilePhoto.includes("cloudinary")) {
      try {
        const publicId = `matrimony/profiles/user_${req.user.id}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Error deleting profile photo:", err);
      }
    }

    // Delete gallery photos from Cloudinary
    if (user.photos && user.photos.length > 0) {
      for (const photoUrl of user.photos) {
        if (photoUrl.includes("cloudinary")) {
          try {
            const parts = photoUrl.split("/");
            const filename = parts[parts.length - 1].split(".")[0];
            await cloudinary.uploader.destroy(`matrimony/gallery/${filename}`);
          } catch (err) {
            console.error("Error deleting gallery photo:", err);
          }
        }
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.user.id);

    // Also clean up connections (optional but good practice)
    const Connection = require("../models/Connection");
    await Connection.deleteMany({
      $or: [{ requester: req.user.id }, { receiver: req.user.id }],
    });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
    });
  }
});

/**
 * @route   PUT /api/user/privacy-settings
 * @desc    Update privacy settings
 * @access  Private
 */
router.put("/privacy-settings", auth, async (req, res) => {
  try {
    const allowedSettings = [
      "showProfile",
      "showPhotos",
      "showContactInfo",
      "showOnlineStatus",
      "allowMessages",
    ];

    const updates = {};
    for (const key of allowedSettings) {
      if (req.body[key] !== undefined) {
        updates[`privacySettings.${key}`] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid settings provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true },
    ).select("-password");

    res.json({
      success: true,
      message: "Privacy settings updated",
      data: user.privacySettings,
    });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating privacy settings",
    });
  }
});

module.exports = router;
