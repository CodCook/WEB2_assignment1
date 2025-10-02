const data = require('./persistence.js')

/**
 * Authenticates a user with username and password.
 * @param {string} username The username to authenticate
 * @param {string} password The password to authenticate
 * @returns {Promise<object>} Object with success status and user data or error message
 */
async function authenticateUser(username, password) {
    const allUsers = await data.loadFile('users.json')
    
    if (!allUsers) {
        return { success: false, message: "Error loading user data." }
    }
    
    // Find user by username and check password (business logic)
    for (let i = 0; i < allUsers.length; i++) {
        if (allUsers[i].username === username && allUsers[i].password === password) {
            return { 
                success: true, 
                user: { 
                    id: allUsers[i].id, 
                    username: allUsers[i].username 
                } 
            }
        }
    }
    
    return { success: false, message: "Invalid username or password." }
}

/**
 * Checks if a user owns a specific photo.
 * @param {number} userId The ID of the user
 * @param {number} photoId The ID of the photo
 * @returns {Promise<object>} Object with success status and ownership info
 */
async function checkPhotoOwnership(userId, photoId) {
    const photo = await data.findPhotoById(photoId)
    
    if (!photo) {
        return { success: false, message: "Photo not found." }
    }
    
    if (photo.owner !== userId) {
        return { success: false, message: "Access denied. You can only access your own photos." }
    }
    
    return { success: true, photo: photo }
}

/**
 * Finds a specific photo by its ID and returns its details with album names.
 * @param {number} photoId The ID of the photo to find
 * @param {number} userId The ID of the logged-in user
 * @returns {Promise<object>} Object with success status, photo data or error message
 */
async function findPhoto(photoId, userId) {
    // Check ownership first
    const ownershipCheck = await checkPhotoOwnership(userId, photoId)
    if (!ownershipCheck.success) {
        return ownershipCheck
    }
    
    const photosData = ownershipCheck.photo
    const allAlbums = await data.loadFile('albums.json')
    const allUsers = await data.loadFile('users.json')

    if (!allAlbums || !allUsers) {
        return { success: false, message: "Error loading data files." }
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

    // Convert owner ID to owner name (business logic)
    let ownerName = "Unknown"
    if (photosData.owner) {
        for (let i = 0; i < allUsers.length; i++) {
            if (allUsers[i].id === photosData.owner) {
                ownerName = allUsers[i].username
                break
            }
        }
    }

    return {
        success: true,
        photo: {
            ...photosData,
            albumNames: albumNames,
            ownerName: ownerName
        }
    }
}

/**
 * Gets a photo for updating purposes.
 * @param {number} photoId The ID of the photo to get
 * @param {number} userId The ID of the logged-in user
 * @returns {Promise<object>} Object with success status and photo data or error message
 */
async function getPhotoForUpdate(photoId, userId) {
    // Check ownership first
    const ownershipCheck = await checkPhotoOwnership(userId, photoId)
    if (!ownershipCheck.success) {
        return ownershipCheck
    }
    
    return { success: true, photo: ownershipCheck.photo }
}

/**
 * Updates the title and description of a photo identified by its ID.
 * @param {number} photoId The ID of the photo to update
 * @param {string} newTitle The new title (empty string means keep current)
 * @param {string} newDescription The new description (empty string means keep current)
 * @param {number} userId The ID of the logged-in user
 * @returns {Promise<object>} Object with success status and message
 */
async function updatePhotoDetails(photoId, newTitle, newDescription, userId) {
    // Check ownership first
    const ownershipCheck = await checkPhotoOwnership(userId, photoId)
    if (!ownershipCheck.success) {
        return ownershipCheck
    }
    
    const photo = ownershipCheck.photo
    
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
 * @param {number} userId The ID of the logged-in user
 * @returns {Promise<object>} Object with success status and message
 */
async function addTagToPhoto(photoId, newTag, userId) {
    // Check ownership first
    const ownershipCheck = await checkPhotoOwnership(userId, photoId)
    if (!ownershipCheck.success) {
        return ownershipCheck
    }
    
    const photo = ownershipCheck.photo
    
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
    authenticateUser,
    findPhoto,
    getPhotoForUpdate,
    updatePhotoDetails,
    listAlbumPhotos,
    addTagToPhoto
}