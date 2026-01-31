/**
 * In-Memory Cache Middleware
 *
 * Provides simple caching for API responses to reduce database load.
 * Uses node-cache for lightweight in-memory storage.
 *
 * For 10K users, this is sufficient. For larger scale, consider Redis.
 */

const NodeCache = require("node-cache");

// Cache with default TTL of 60 seconds, check period of 120 seconds
const cache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false, // Performance optimization
});

/**
 * Cache middleware factory
 * @param {number} duration - TTL in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Create cache key from URL and user ID (if authenticated)
    const userId = req.user?.id || "anonymous";
    const key = `${userId}:${req.originalUrl}`;

    // Check if cached response exists
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for a specific user
 * Useful after profile updates
 */
const clearUserCache = (userId) => {
  const keys = cache.keys();
  keys.forEach((key) => {
    if (key.startsWith(`${userId}:`)) {
      cache.del(key);
    }
  });
};

/**
 * Clear all cache
 * Useful for admin operations
 */
const clearAllCache = () => {
  cache.flushAll();
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cache,
  cacheMiddleware,
  clearUserCache,
  clearAllCache,
  getCacheStats,
};
