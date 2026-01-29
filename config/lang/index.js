/**
 * Language Index
 * Exports all language modules
 */

const en = require("./en");
const hi = require("./hi");
const kn = require("./kn");

const languages = { en, hi, kn };

/**
 * Get language strings for a specific language
 * @param {string} langCode - 'en', 'hi', or 'kn'
 * @returns {Object} Language strings
 */
function getLanguage(langCode = "en") {
  return languages[langCode] || languages.en;
}

/**
 * Get available languages
 * @returns {Array} Array of language codes
 */
function getAvailableLanguages() {
  return [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  ];
}

module.exports = {
  getLanguage,
  getAvailableLanguages,
  languages,
};
