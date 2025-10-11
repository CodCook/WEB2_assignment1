const fs  = require('fs/promises')
const {MongoClient} = require('mongodb')

let client = undefined

async function connectToDb(){
    if (!client){
        client = new MongoClient('mongodb+srv://60304062:class1234@cluster0mahgoub.potrxqn.mongodb.net/')
        await client.connect()
    }
}



/**
 * Load JSON data from a file
 * @param {string} fileName - path to JSON file
 * @returns {Promise<any>} parsed JSON
 */
async function loadPhotos() {
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const photos = await db.collection('photos')
    return await photos.find().toArray()
}

/**
 * Save JSON data to a file
 * @param {string} fileName - path to JSON file
 * @param {any} data - data to serialize
 * @returns {Promise<void>}
 */

/**
 * Get all albums from storage
 * @returns {Promise<Array>} list of album objects
 */
async function getAllAlbums() {
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const albums = await db.collection('albums')
    return await albums.find().toArray()
}

/**
 * Find a photo by id
 * @param {number} id - photo id
 * @returns {Promise<Object|null>} photo object or null
 */
async function findPhotoById(id) {
    const photos = await loadPhotos()
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
    const photos = await loadPhotos()
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
 * Update a photo title/description and persist
 * @param {number} id - photo id
 * @param {string|null|undefined} title - new title or null/undefined to skip
 * @param {string|null|undefined} description - new description or null/undefined to skip
 * @returns {Promise<Object>} { success: boolean }
 */
async function updatePhoto(id, title, description) {
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    const photos = await getAllPhotos()
    let found = false
    if (title !== null && title !== undefined) {
        updatedTitle = await photosCollection.updateOne({ id: id }, { $set: { title: title } })
        
    }
    if (description !== null && description !== undefined) {
        updatedDescription = await photosCollection.updateOne({ id: id }, { $set: { description: description } })
    }
    if (updatedTitle && updatedDescription) {
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
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    const photos = await loadPhotos()
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
    loadPhotos,
    getAllAlbums,
    findPhotoById,
    getAlbumsByIds,
    findAlbumsByName,
    getPhotosByAlbumIds,
    updatePhoto,
    addTagToPhoto,
}