const mongoose = require("mongoose");

/**
 * User Schema for Indian Matrimony App
 *
 * This comprehensive schema includes:
 * - Basic Info: Core personal details
 * - Cultural Info: Religion, caste, language preferences
 * - Career Info: Education and professional details
 * - Partner Preferences: Criteria for matching algorithm
 * - Connection Requests: Track sent/received connection requests
 */

const UserSchema = new mongoose.Schema(
  {
    // Authentication fields
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    photos: {
      type: [String],
      validate: [
        function (val) {
          return val.length <= 4;
        },
        "{PATH} exceeds the limit of 4",
      ],
      default: [],
    },

    // Basic Information
    basicInfo: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      age: {
        type: Number,
        min: [18, "Must be at least 18 years old"],
        max: [100, "Age cannot exceed 100"],
      },
      gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: "",
      },
      dateOfBirth: {
        type: Date,
      },
      height: {
        type: Number, // in cm
        validate: {
          validator: function (v) {
            return (
              v === undefined || v === null || v === 0 || (v >= 100 && v <= 250)
            );
          },
          message: "Height must be between 100 and 250 cm",
        },
      },
      weight: {
        type: Number, // in kg
        validate: {
          validator: function (v) {
            return (
              v === undefined || v === null || v === 0 || (v >= 30 && v <= 200)
            );
          },
          message: "Weight must be between 30 and 200 kg",
        },
      },
      maritalStatus: {
        type: String,
        enum: ["never_married", "divorced", "widowed", "awaiting_divorce", ""],
        default: "",
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "India",
      },
    },

    // Cultural Information
    culturalInfo: {
      religion: {
        type: String,
        enum: [
          "hindu",
          "muslim",
          "christian",
          "sikh",
          "buddhist",
          "jain",
          "other",
          "",
        ],
        default: "",
      },
      caste: {
        type: String,
        trim: true,
      },
      subCaste: {
        type: String,
        trim: true,
      },
      motherTongue: {
        type: String,
        trim: true,
      },
      horoscope: {
        rashi: String,
        nakshatra: String,
        manglik: {
          type: String,
          enum: ["yes", "no", "partial", "dont_know", ""],
          default: "",
        },
      },
      gothra: {
        type: String,
        trim: true,
      },
    },

    // Career and Education Information
    careerInfo: {
      education: {
        type: String,
        enum: [
          "high_school",
          "diploma",
          "bachelors",
          "masters",
          "doctorate",
          "other",
          "",
        ],
        default: "",
      },
      educationDetail: {
        type: String, // E.g., "B.Tech in Computer Science"
        trim: true,
      },
      college: {
        type: String,
        trim: true,
      },
      profession: {
        type: String,
        trim: true,
      },
      company: {
        type: String,
        trim: true,
      },
      annualIncome: {
        type: String,
        enum: [
          "not_specified",
          "below_3lpa",
          "3_to_5lpa",
          "5_to_10lpa",
          "10_to_15lpa",
          "15_to_25lpa",
          "25_to_50lpa",
          "above_50lpa",
          "",
        ],
        default: "",
      },
      workLocation: {
        type: String,
        trim: true,
      },
    },

    // Family Information
    familyInfo: {
      fatherName: String,
      fatherOccupation: String,
      motherName: String,
      motherOccupation: String,
      siblings: {
        brothers: { type: Number, default: 0 },
        sisters: { type: Number, default: 0 },
        marriedBrothers: { type: Number, default: 0 },
        marriedSisters: { type: Number, default: 0 },
      },
      familyType: {
        type: String,
        enum: ["joint", "nuclear", ""],
        default: "",
      },
      familyStatus: {
        type: String,
        enum: ["middle_class", "upper_middle_class", "rich", "affluent", ""],
        default: "",
      },
      familyValues: {
        type: String,
        enum: ["traditional", "moderate", "liberal", ""],
        default: "",
      },
    },

    // Partner Preferences - Used for matching algorithm
    partnerPreferences: {
      ageRange: {
        min: { type: Number, default: 18 },
        max: { type: Number, default: 50 },
      },
      heightRange: {
        min: { type: Number, default: 100 }, // in cm
        max: { type: Number, default: 250 },
      },
      maritalStatus: [
        {
          type: String,
          enum: ["never_married", "divorced", "widowed", "awaiting_divorce"],
        },
      ],
      religion: [
        {
          type: String,
          enum: [
            "hindu",
            "muslim",
            "christian",
            "sikh",
            "buddhist",
            "jain",
            "other",
          ],
        },
      ],
      caste: [
        {
          type: String,
        },
      ],
      motherTongue: [
        {
          type: String,
        },
      ],
      education: [
        {
          type: String,
          enum: [
            "high_school",
            "diploma",
            "bachelors",
            "masters",
            "doctorate",
            "other",
          ],
        },
      ],
      profession: [
        {
          type: String,
        },
      ],
      minIncome: {
        type: String,
        enum: [
          "not_specified",
          "below_3lpa",
          "3_to_5lpa",
          "5_to_10lpa",
          "10_to_15lpa",
          "15_to_25lpa",
          "25_to_50lpa",
          "above_50lpa",
        ],
        default: "not_specified",
      },
      locations: [
        {
          type: String,
        },
      ],
      manglikPreference: {
        type: String,
        enum: ["yes", "no", "doesnt_matter", ""],
        default: "doesnt_matter",
      },
    },

    // Connection Requests
    connectionRequests: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        type: {
          type: String,
          enum: ["sent", "received"],
          required: true,
        },
        message: {
          type: String,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
        },
      },
    ],

    // About Me / Bio
    about: {
      type: String,
      maxlength: 1000,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Privacy Settings
    privacySettings: {
      showProfile: {
        type: Boolean,
        default: true,
      },
      showPhotos: {
        type: Boolean,
        default: true,
      },
      showContactInfo: {
        type: Boolean,
        default: false,
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
      allowMessages: {
        type: Boolean,
        default: true,
      },
    },

    // Wallet System - Used for unlocking full profiles
    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: 0,
      },
      transactions: [
        {
          type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          relatedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      profilesUnlocked: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          unlockedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// ===================
// INDEXES FOR HIGH PERFORMANCE
// ===================

// Compound index for recommendations query (most critical for 10K users)
// Matches the filter pattern: isActive + isProfileComplete + gender + age range
UserSchema.index({
  isActive: 1,
  isProfileComplete: 1,
  "basicInfo.gender": 1,
  "basicInfo.age": 1,
});

// Index for religion filtering (frequently used in preferences)
UserSchema.index({
  isActive: 1,
  isProfileComplete: 1,
  "culturalInfo.religion": 1,
});

// Single field indexes for common lookups
// UserSchema.index({ email: 1 }); // Removed: duplicate of unique: true
UserSchema.index({ phone: 1 });
UserSchema.index({ "basicInfo.city": 1 });
UserSchema.index({ "careerInfo.annualIncome": 1 });
UserSchema.index({ lastActive: -1 }); // For "recently active" sorting

// Text index for search functionality
UserSchema.index({
  "basicInfo.name": "text",
  "basicInfo.city": "text",
  "careerInfo.profession": "text",
});

// Virtual for full name display
UserSchema.virtual("displayName").get(function () {
  return this.basicInfo?.name || this.email.split("@")[0];
});

// Method to check if user can be matched
UserSchema.methods.isMatchable = function () {
  return this.isActive && this.isProfileComplete;
};

// Static method to get income level as number for comparison
UserSchema.statics.getIncomeLevel = function (incomeRange) {
  const incomeMap = {
    not_specified: 0,
    below_3lpa: 1,
    "3_to_5lpa": 2,
    "5_to_10lpa": 3,
    "10_to_15lpa": 4,
    "15_to_25lpa": 5,
    "25_to_50lpa": 6,
    above_50lpa: 7,
  };
  return incomeMap[incomeRange] || 0;
};

module.exports = mongoose.model("User", UserSchema);
