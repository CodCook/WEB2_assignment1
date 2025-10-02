const fs = require('fs').promises

/**
 * Asynchronously loads and parses a JSON file.
 * @param {string} fileName The path to the JSON file to be loaded.
 * @returns {Promise<object|Array|null>} A promise that resolves to the parsed JSON data, or null if an error occurs.
 */
async function loadFile(fileName) {
    try {
        const fileContent = await fs.readFile(fileName, 'utf8')
        return JSON.parse(fileContent)
    } catch (error) {
        return null
    }
}

/**
 * Asynchronously saves data to a JSON file.
 * @param {string} fileName The path to the JSON file where data will be saved.
 * @param {object|Array} data The JavaScript object or array to be saved.
 * @returns {Promise<boolean>} A promise that resolves to true on success, or false on failure.
 */
async function saveFile(fileName, data) {
    try {
        const fileContent = JSON.stringify(data, null, 4)
        await fs.writeFile(fileName, fileContent)
        return true
    } catch (error) {
        return false
    }
}

/**
 * Finds a photo by its ID from the photos.json file.
 * @param {number} photoId The ID of the photo to find
 * @returns {Promise<object|null>} The photo object or null if not found
 */
async function findPhotoById(photoId) {
    const photosData = await loadFile('photos.json')
    
    if (!photosData) return null
    
    // Handle both single object and array formats
    if (Array.isArray(photosData)) {
        return photosData.find(photo => photo.id === photoId) || null
    } else {
        return photosData.id === photoId ? photosData : null
    }
}

/**
 * Updates a photo by its ID in the photos.json file.
 * @param {number} photoId The ID of the photo to update
 * @param {object} updatedPhoto The updated photo object
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function updatePhoto(photoId, updatedPhoto) {
    const photosData = await loadFile('photos.json')
    
    if (!photosData) return false
    
    // Handle both single object and array formats
    if (Array.isArray(photosData)) {
        const index = photosData.findIndex(photo => photo.id === photoId)
        if (index === -1) return false
        photosData[index] = updatedPhoto
        return await saveFile('photos.json', photosData)
    } else {
        if (photosData.id === photoId) {
            return await saveFile('photos.json', updatedPhoto)
        }
        return false
    }
}

/**
 * Finds all photos belonging to a specific album.
 * @param {number} albumId The ID of the album
 * @returns {Promise<Array>} Array of photos in the album
 */
async function findPhotosByAlbum(albumId) {
    const photosData = await loadFile('photos.json')
    
    if (!photosData) return []
    
    // Handle both single object and array formats
    if (Array.isArray(photosData)) {
        return photosData.filter(photo => photo.albums.includes(albumId))
    } else {
        return photosData.albums.includes(albumId) ? [photosData] : []
    }
}

module.exports = {
    loadFile,
    saveFile,
    findPhotoById,
    updatePhoto,
    findPhotosByAlbum
}