/**
 * Watermark Utility for Cloudinary Images
 *
 * Adds a text overlay watermark to Cloudinary image URLs using URL transformations.
 * This prevents users from screenshotting and misusing profile photos.
 */

/**
 * Add watermark transformation to a Cloudinary URL
 * @param {string} url - The original Cloudinary image URL
 * @param {string} text - The watermark text (default: "Lagnam")
 * @returns {string} - The URL with watermark transformation
 */
function addWatermark(url, text = "Lagnam") {
    if (!url || !url.includes("cloudinary.com")) {
        return url;
    }

    // Cloudinary URL structure: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}
    // We need to insert the watermark transformation after "upload/"

    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) {
        return url;
    }

    // Watermark transformation:
    // l_text:fontfamily_size:text - text overlay
    // co_rgb:FFFFFF - white color with some transparency
    // o_50 - 50% opacity (semi-transparent)
    // g_south_east - gravity bottom-right
    // x_10,y_10 - offset from corner
    const watermarkTransform = `l_text:Arial_20_bold:${text},co_white,o_50,g_south_east,x_20,y_20`;

    // Insert transformation after /upload/
    const beforeUpload = url.substring(0, uploadIndex + 8); // includes "/upload/"
    const afterUpload = url.substring(uploadIndex + 8);

    return `${beforeUpload}${watermarkTransform}/${afterUpload}`;
}

/**
 * Add watermark to profile photo and gallery photos
 * @param {Object} userData - User data object
 * @returns {Object} - User data with watermarked URLs
 */
function watermarkUserPhotos(userData) {
    if (!userData) return userData;

    const result = { ...userData };

    // Watermark profile photo
    if (result.profilePhoto) {
        result.profilePhoto = addWatermark(result.profilePhoto);
    }

    // Watermark gallery photos
    if (result.photos && Array.isArray(result.photos)) {
        result.photos = result.photos.map((url) => addWatermark(url));
    }

    return result;
}

module.exports = {
    addWatermark,
    watermarkUserPhotos,
};
