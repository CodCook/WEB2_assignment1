const fs  = require('fs/promises')
const {MongoClient} = require('mongodb')

let client = undefined

async function connectToDb(){
    if (!client){
        // prefer environment variable for credentials, fallback to existing string
        const uri = process.env.MONGO_URI || 'mongodb+srv://60304062:class1234@cluster0mahgoub.potrxqn.mongodb.net/'
        client = new MongoClient(uri)
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
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const photosCollection = db.collection('photos')
    // use a direct query so we don't need to load the entire collection
    const photo = await photosCollection.findOne({ id: id })
    return photo || null
}

/**
 * Return album objects matching provided ids
 * @param {Array<number>} ids - album ids
 * @returns {Promise<Array>} album objects
 */
async function getAlbumsByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return []
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const albumsColl = db.collection('albums')
    // use $in to fetch matching album docs directly
    return await albumsColl.find({ id: { $in: ids } }).toArray()
}

/**
 * Find albums by exact name (case-insensitive)
 * @param {string} name - album name
 * @returns {Promise<Array>} matching album objects
 */
async function findAlbumsByName(name) {
    if (!name) return []
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const albumsColl = db.collection('albums')
    // case-insensitive exact match using regex
    function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
    const regex = new RegExp('^' + escapeRegex(name) + '$', 'i')
    return await albumsColl.find({ name: { $regex: regex } }).toArray()
}

/**
 * Get photos that belong to any of the provided album ids
 * @param {Array<number>} albumIds - album ids
 * @returns {Promise<Array>} matching photos
 */
async function getPhotosByAlbumIds(albumIds) {
    if (!Array.isArray(albumIds) || albumIds.length === 0) return []
    await connectToDb()
    const db = client.db('infs3201_fall2025')
    const photosColl = db.collection('photos')
    // find photos where the albums array contains any of the provided ids
    return await photosColl.find({ albums: { $in: albumIds } }).toArray()
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
    let updateFields = {}
    if (title !== null && title !== undefined) {
        updateFields.title = title
    }
    if (description !== null && description !== undefined) {
        updateFields.description = description
    }
    if (Object.keys(updateFields).length === 0) {
        return { success: false }
    }
    const result = await photosCollection.updateOne({ id: id }, { $set: updateFields })
    console.log('persistence.updatePhoto result:', result)
    if (result.modifiedCount > 0) {
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
    const photo = await findPhotoById(id)
    if (photo && photo.tags.includes(tag)) {
        return { success: true }
    }
    const result = await photosCollection.updateOne({ id: id }, { $addToSet: { tags: tag } })
    if (result.modifiedCount > 0) {
        return { success: true }
    }
    return { success: false }
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