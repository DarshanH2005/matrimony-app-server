/**
 * Config Routes
 *
 * Public endpoints for broker config and language strings.
 * No auth required - used by client app and admin panel.
 */

const express = require("express");
const brokerConfig = require("../config/broker.config");
const { getLanguage, getAvailableLanguages } = require("../config/lang");

const router = express.Router();

/**
 * GET /api/config
 * Get broker configuration (public)
 */
router.get("/", (req, res) => {
  // Return public config (exclude sensitive data)
  res.json({
    success: true,
    data: {
      broker: brokerConfig.broker,
      branding: brokerConfig.branding,
      app: brokerConfig.app,
      features: brokerConfig.features,
    },
  });
});

/**
 * GET /api/config/languages
 * Get available languages
 */
router.get("/languages", (req, res) => {
  res.json({
    success: true,
    data: {
      available: getAvailableLanguages(),
      default: brokerConfig.app.defaultLanguage,
    },
  });
});

/**
 * GET /api/config/lang/:code
 * Get language strings for a specific language
 */
router.get("/lang/:code", (req, res) => {
  const langCode = req.params.code;
  const strings = getLanguage(langCode);

  res.json({
    success: true,
    data: {
      code: langCode,
      strings,
    },
  });
});

module.exports = router;
