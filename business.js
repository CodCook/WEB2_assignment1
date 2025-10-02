const data = require('./persistence.js')

/**
 * Finds a specific photo by its ID and returns its details with album names.
 * @param {number} photoId The ID of the photo to find
 * @returns {Promise<object>} Object with success status, photo data or error message
 */
async function findPhoto(photoId) {
    const photosData = await data.findPhotoById(photoId)
    const allAlbums = await data.loadFile('albums.json')

    if (!photosData || !allAlbums) {
        return { success: false, message: "Error loading data files." }
    }

    if (!photosData) {
        return { success: false, message: "Sorry, a photo with that ID could not be found." }
    }

    // Convert album IDs to album names (business logic)
    const albumNames = []
    for (let i = 0; i < photosData.albums.length; i++) {
        const albumId = photosData.albums[i]
        for (let j = 0; j < allAlbums.length; j++) {
            if (allAlbums[j].id === albumId) {
                albumNames.push(allAlbums[j].name)
            }
        }
    }

    return {
        success: true,
        photo: {
            ...photosData,
            albumNames: albumNames
        }
    }
}

/**
 * Gets a photo for updating purposes.
 * @param {number} photoId The ID of the photo to get
 * @returns {Promise<object>} Object with success status and photo data or error message
 */
async function getPhotoForUpdate(photoId) {
    const photo = await data.findPhotoById(photoId)
    
    if (!photo) {
        return { success: false, message: "Sorry, a photo with that ID could not be found." }
    }
    
    return { success: true, photo: photo }
}

/**
 * Updates the title and description of a photo identified by its ID.
 * @param {number} photoId The ID of the photo to update
 * @param {string} newTitle The new title (empty string means keep current)
 * @param {string} newDescription The new description (empty string means keep current)
 * @returns {Promise<object>} Object with success status and message
 */
async function updatePhotoDetails(photoId, newTitle, newDescription) {
    const photo = await data.findPhotoById(photoId)
    
    if (!photo) {
        return { success: false, message: "Sorry, a photo with that ID could not be found." }
    }
    
    // Apply business logic for updates
    if (newTitle !== "") {
        photo.title = newTitle
    }
    
    if (newDescription !== "") {
        photo.description = newDescription
    }
    
    const saveResult = await data.updatePhoto(photoId, photo)
    
    if (saveResult) {
        return { success: true, message: "Photo has been updated successfully!" }
    } else {
        return { success: false, message: "Error updating photo." }
    }
}

/**
 * Lists all photos belonging to a specific album.
 * @param {string} albumName The name of the album to search for
 * @returns {Promise<object>} Object with success status, photos array or error message
 */
async function listAlbumPhotos(albumName) {
    const allAlbums = await data.loadFile('albums.json')
    
    if (!allAlbums) {
        return { success: false, message: "Error loading albums data." }
    }
    
    // Find album by name (case-insensitive business logic)
    let albumId = -1
    for (let i = 0; i < allAlbums.length; i++) {
        if (allAlbums[i].name.toLowerCase() === albumName.toLowerCase()) {
            albumId = allAlbums[i].id
            break
        }
    }
    
    if (albumId === -1) {
        return { success: false, message: "Sorry, an album with that name could not be found." }
    }
    
    const photos = await data.findPhotosByAlbum(albumId)
    
    if (!photos) {
        return { success: false, message: "Error loading photos data." }
    }
    
    return { success: true, photos: photos }
}

/**
 * Adds a new tag to a photo, preventing duplicates.
 * @param {number} photoId The ID of the photo to tag
 * @param {string} newTag The tag to add
 * @returns {Promise<object>} Object with success status and message
 */
async function addTagToPhoto(photoId, newTag) {
    const photo = await data.findPhotoById(photoId)
    
    if (!photo) {
        return { success: false, message: "Sorry, a photo with that ID could not be found." }
    }
    
    // Business logic: check for duplicate tags (case-insensitive)
    let tagAlreadyExists = false
    for (let i = 0; i < photo.tags.length; i++) {
        if (photo.tags[i].toLowerCase() === newTag.toLowerCase()) {
            tagAlreadyExists = true
            break
        }
    }
    
    if (tagAlreadyExists) {
        return { success: false, message: `The tag "${newTag}" already exists on this photo.` }
    }
    
    photo.tags.push(newTag)
    const saveResult = await data.updatePhoto(photoId, photo)
    
    if (saveResult) {
        return { success: true, message: "Tag added successfully!" }
    } else {
        return { success: false, message: "Error adding tag." }
    }
}


module.exports = {
    findPhoto,
    getPhotoForUpdate,
    updatePhotoDetails,
    listAlbumPhotos,
    addTagToPhoto
}