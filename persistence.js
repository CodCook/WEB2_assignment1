const fs  = require('fs/promises')



/**
 * Load JSON data from a file
 * @param {string} fileName - path to JSON file
 * @returns {Promise<any>} parsed JSON
 */
async function loadData(fileName) {
    const content = await fs.readFile(fileName, 'utf-8')
    return JSON.parse(content)
}

/**
 * Save JSON data to a file
 * @param {string} fileName - path to JSON file
 * @param {any} data - data to serialize
 * @returns {Promise<void>}
 */
async function saveData(fileName, data) {
    await fs.writeFile(fileName, JSON.stringify(data, null, 2))
    // keep logging for visibility
    console.log(`Data saved to ${fileName}`)
}

/**
 * Get all photos from storage
 * @returns {Promise<Array>} list of photo objects
 */
async function getAllPhotos() {
    return await loadData('photos.json')
}

/**
 * Get all albums from storage
 * @returns {Promise<Array>} list of album objects
 */
async function getAllAlbums() {
    return await loadData('albums.json')
}

/**
 * Find a photo by id
 * @param {number} id - photo id
 * @returns {Promise<Object|null>} photo object or null
 */
async function findPhotoById(id) {
    const photos = await getAllPhotos()
    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id === id) {
            return photos[i]
        }
    }
    return null
}

/**
 * Return album objects matching provided ids
 * @param {Array<number>} ids - album ids
 * @returns {Promise<Array>} album objects
 */
async function getAlbumsByIds(ids) {
    const albums = await getAllAlbums()
    const result = []
    for (let i = 0; i < albums.length; i++) {
        for (let j = 0; j < ids.length; j++) {
            if (albums[i].id === ids[j]) {
                result.push(albums[i])
                break
            }
        }
    }
    return result
}

/**
 * Find albums by exact name (case-insensitive)
 * @param {string} name - album name
 * @returns {Promise<Array>} matching album objects
 */
async function findAlbumsByName(name) {
    const albums = await getAllAlbums()
    const target = (name || '').toLowerCase()
    const matches = []
    for (let i = 0; i < albums.length; i++) {
        if (albums[i].name && albums[i].name.toLowerCase() === target) {
            matches.push(albums[i])
        }
    }
    return matches
}

/**
 * Get photos that belong to any of the provided album ids
 * @param {Array<number>} albumIds - album ids
 * @returns {Promise<Array>} matching photos
 */
async function getPhotosByAlbumIds(albumIds) {
    const photos = await getAllPhotos()
    if (!Array.isArray(albumIds) || albumIds.length === 0) {
        return []
    }
    const result = []
    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        if (!Array.isArray(photo.albums)) {
            continue
        }
        let belongs = false
        for (let j = 0; j < photo.albums.length; j++) {
            for (let k = 0; k < albumIds.length; k++) {
                if (photo.albums[j] === albumIds[k]) {
                    belongs = true
                    break
                }
            }
            if (belongs) {
                break
            }
        }
        if (belongs) {
            result.push(photo)
        }
    }
    return result
}

/**
 * Save photos array back to storage
 * @param {Array} photos - photos array
 * @returns {Promise<void>}
 */
async function savePhotos(photos) {
    return await saveData('photos.json', photos)
}

/**
 * Update a photo title/description and persist
 * @param {number} id - photo id
 * @param {string|null|undefined} title - new title or null/undefined to skip
 * @param {string|null|undefined} description - new description or null/undefined to skip
 * @returns {Promise<Object>} { success: boolean }
 */
async function updatePhoto(id, title, description) {
    const photos = await getAllPhotos()
    let found = false
    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id === id) {
            found = true
            if (title !== null && title !== undefined) {
                photos[i].title = title
            }
            if (description !== null && description !== undefined) {
                photos[i].description = description
            }
            break
        }
    }
    if (found) {
        await savePhotos(photos)
        return { success: true }
    }
    return { success: false }
}

/**
 * Add a tag to a photo and persist (idempotent)
 * @param {number} id - photo id
 * @param {string} tag - tag to add
 * @returns {Promise<Object>} result object
 */
async function addTagToPhoto(id, tag) {
    const photos = await getAllPhotos()
    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id === id) {
            if (!Array.isArray(photos[i].tags)) {
                photos[i].tags = []
            }
            let exists = false
            for (let j = 0; j < photos[i].tags.length; j++) {
                if (photos[i].tags[j].toLowerCase() === (tag || '').toLowerCase()) {
                    exists = true
                    break
                }
            }
            if (!exists) {
                photos[i].tags.push(tag)
                await savePhotos(photos)
                return { success: true, message: 'Updated' }
            }
            return { success: false, message: 'Tag already exists' }
        }
    }
    return { success: false, message: 'Photo not found' }
}

module.exports = {
    getAllPhotos,
    getAllAlbums,
    findPhotoById,
    getAlbumsByIds,
    findAlbumsByName,
    getPhotosByAlbumIds,
    savePhotos,
    updatePhoto,
    addTagToPhoto,
}