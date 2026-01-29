const express = require("express");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { getRecommendations } = require("../utils/matchingAlgorithm");

const router = express.Router();

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

module.exports = router;
