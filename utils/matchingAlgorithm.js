const User = require("../models/User");

/**
 * Matching Algorithm for Indian Matrimony App
 *
 * This module implements a sophisticated matching algorithm that:
 * 1. Filters users based on partner preferences
 * 2. Excludes already connected/rejected users
 * 3. Calculates a match score based on how many criteria match
 * 4. Returns sorted recommendations
 *
 * MATCHING CRITERIA:
 * - Age: Must fall within preferred age range
 * - Gender: Opposite gender (or as preferred)
 * - Religion: Must match if preference is set
 * - Caste: Must match if preference is set (optional)
 * - Income: Must meet minimum income requirement
 * - Location: Bonus points for preferred locations
 * - Education: Bonus points for preferred education level
 */

/**
 * Get income level as number for comparison
 */
const getIncomeLevel = (incomeRange) => {
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

/**
 * Calculate match score between two users
 * Higher score = better match
 *
 * @param {Object} user - The user to evaluate
 * @param {Object} preferences - Partner preferences of requesting user
 * @returns {number} Match score (0-100)
 */
const calculateMatchScore = (user, preferences) => {
  let score = 0;
  let maxScore = 0;

  // Age match (20 points)
  maxScore += 20;
  if (user.basicInfo?.age) {
    const age = user.basicInfo.age;
    const minAge = preferences.ageRange?.min || 18;
    const maxAge = preferences.ageRange?.max || 50;
    if (age >= minAge && age <= maxAge) {
      score += 20;
    }
  }

  // Religion match (20 points)
  maxScore += 20;
  if (preferences.religion && preferences.religion.length > 0) {
    if (
      user.culturalInfo?.religion &&
      preferences.religion.includes(user.culturalInfo.religion)
    ) {
      score += 20;
    }
  } else {
    score += 20; // No preference set, full score
  }

  // Caste match (15 points)
  maxScore += 15;
  if (preferences.caste && preferences.caste.length > 0) {
    if (
      user.culturalInfo?.caste &&
      preferences.caste.includes(user.culturalInfo.caste)
    ) {
      score += 15;
    }
  } else {
    score += 15; // No preference set, full score
  }

  // Income match (15 points)
  maxScore += 15;
  if (preferences.minIncome && preferences.minIncome !== "not_specified") {
    const userIncomeLevel = getIncomeLevel(user.careerInfo?.annualIncome);
    const minIncomeLevel = getIncomeLevel(preferences.minIncome);
    if (userIncomeLevel >= minIncomeLevel) {
      score += 15;
    }
  } else {
    score += 15; // No preference set, full score
  }

  // Education match (10 points)
  maxScore += 10;
  if (preferences.education && preferences.education.length > 0) {
    if (
      user.careerInfo?.education &&
      preferences.education.includes(user.careerInfo.education)
    ) {
      score += 10;
    }
  } else {
    score += 10; // No preference set, full score
  }

  // Height match (10 points)
  maxScore += 10;
  if (user.basicInfo?.height) {
    const height = user.basicInfo.height;
    const minHeight = preferences.heightRange?.min || 100;
    const maxHeight = preferences.heightRange?.max || 250;
    if (height >= minHeight && height <= maxHeight) {
      score += 10;
    }
  } else {
    score += 10; // No height specified, give full score
  }

  // Location match (10 points)
  maxScore += 10;
  if (preferences.locations && preferences.locations.length > 0) {
    const userLocation = user.basicInfo?.city || user.basicInfo?.state;
    if (
      userLocation &&
      preferences.locations.some(
        (loc) => loc.toLowerCase() === userLocation.toLowerCase(),
      )
    ) {
      score += 10;
    }
  } else {
    score += 10; // No preference set, full score
  }

  // Calculate percentage score
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
};

/**
 * Get recommended profiles for a user
 *
 * @param {string} userId - ID of the requesting user
 * @param {Object} filters - Additional filters from request
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of results per page
 * @returns {Object} { users: [], totalCount, page, totalPages }
 */
const getRecommendations = async (
  userId,
  filters = {},
  page = 1,
  limit = 10,
) => {
  console.log(`[Matching] Starting recommendations for user ${userId}, page ${page}`);
  try {
    // Get the requesting user with their preferences
    const requestingUser = await User.findById(userId);

    if (!requestingUser) {
      console.error(`[Matching] User ${userId} not found`);
      throw new Error("User not found");
    }

    const preferences = requestingUser.partnerPreferences || {};
    const userGender = requestingUser.basicInfo?.gender;

    console.log(`[Matching] Algorithm inputs: Gender=${userGender}, Prefs=${JSON.stringify(preferences.religion || 'none')}`);

    // Build exclude list: users already connected/pending/rejected
    const excludeIds = [userId]; // Always exclude self

    if (
      requestingUser.connectionRequests &&
      requestingUser.connectionRequests.length > 0
    ) {
      requestingUser.connectionRequests.forEach((conn) => {
        excludeIds.push(conn.userId.toString());
      });
    }

    // Build the query
    const query = {
      _id: { $nin: excludeIds },
      isActive: true,
      isProfileComplete: true,
    };

    // Gender filter (opposite gender by default)
    if (userGender === "male") {
      query["basicInfo.gender"] = "female";
    } else if (userGender === "female") {
      query["basicInfo.gender"] = "male";
    }

    // Age range filter
    if (preferences.ageRange) {
      query["basicInfo.age"] = {
        $gte: preferences.ageRange.min || 18,
        $lte: preferences.ageRange.max || 50,
      };
    }

    // Religion filter (if preferences set)
    if (preferences.religion && preferences.religion.length > 0) {
      query["culturalInfo.religion"] = { $in: preferences.religion };
    }

    // Apply additional filters from request
    if (filters.religion) {
      query["culturalInfo.religion"] = filters.religion;
    }
    if (filters.minAge && filters.maxAge) {
      query["basicInfo.age"] = {
        $gte: parseInt(filters.minAge),
        $lte: parseInt(filters.maxAge),
      };
    }
    if (filters.city) {
      query["basicInfo.city"] = new RegExp(filters.city, "i");
    }

    console.log(`[Matching] Query built: ${JSON.stringify(query)}`);

    // Get total count for pagination
    console.time("countDocuments");
    const totalCount = await User.countDocuments(query);
    console.timeEnd("countDocuments");
    console.log(`[Matching] Found ${totalCount} potential matches`);

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch matching users
    console.time("findUsers");
    const users = await User.find(query)
      .select("-password -connectionRequests")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    console.timeEnd("findUsers");

    console.log(`[Matching] Fetched ${users.length} users`);

    // Calculate match scores and sort
    console.time("scoring");
    const usersWithScores = users.map((user) => ({
      ...user,
      matchScore: calculateMatchScore(user, preferences),
    }));

    // Sort by match score (highest first)
    usersWithScores.sort((a, b) => b.matchScore - a.matchScore);
    console.timeEnd("scoring");

    return {
      users: usersWithScores,
      totalCount,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    throw error;
  }
};

/**
 * MongoDB Aggregation Pipeline version (alternative approach)
 *
 * This can be used for more complex matching with server-side score calculation
 */
const getRecommendationsAggregation = async (
  userId,
  filters = {},
  page = 1,
  limit = 10,
) => {
  try {
    const requestingUser = await User.findById(userId);
    if (!requestingUser) {
      throw new Error("User not found");
    }

    const preferences = requestingUser.partnerPreferences || {};
    const userGender = requestingUser.basicInfo?.gender;

    // Get exclude IDs
    const excludeIds = [requestingUser._id];
    if (requestingUser.connectionRequests) {
      requestingUser.connectionRequests.forEach((conn) => {
        excludeIds.push(conn.userId);
      });
    }

    // Build aggregation pipeline
    const pipeline = [
      // Stage 1: Match basic criteria
      {
        $match: {
          _id: { $nin: excludeIds },
          isActive: true,
          isProfileComplete: true,
          "basicInfo.gender": userGender === "male" ? "female" : "male",
        },
      },

      // Stage 2: Add computed match score
      {
        $addFields: {
          matchScore: {
            $add: [
              // Age score (20 points)
              {
                $cond: {
                  if: {
                    $and: [
                      {
                        $gte: [
                          "$basicInfo.age",
                          preferences.ageRange?.min || 18,
                        ],
                      },
                      {
                        $lte: [
                          "$basicInfo.age",
                          preferences.ageRange?.max || 50,
                        ],
                      },
                    ],
                  },
                  then: 20,
                  else: 0,
                },
              },
              // Religion score (20 points)
              {
                $cond: {
                  if: {
                    $or: [
                      { $eq: [{ $size: preferences.religion || [] }, 0] },
                      {
                        $in: [
                          "$culturalInfo.religion",
                          preferences.religion || [],
                        ],
                      },
                    ],
                  },
                  then: 20,
                  else: 0,
                },
              },
              // Add more scoring conditions as needed
            ],
          },
        },
      },

      // Stage 3: Sort by match score
      { $sort: { matchScore: -1 } },

      // Stage 4: Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // Stage 5: Project (exclude sensitive fields)
      {
        $project: {
          password: 0,
          connectionRequests: 0,
        },
      },
    ];

    const users = await User.aggregate(pipeline);
    const totalCount = await User.countDocuments({
      _id: { $nin: excludeIds },
      isActive: true,
      isProfileComplete: true,
    });

    return {
      users,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page < Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error in getRecommendationsAggregation:", error);
    throw error;
  }
};

module.exports = {
  getRecommendations,
  getRecommendationsAggregation,
  calculateMatchScore,
  getIncomeLevel,
};
