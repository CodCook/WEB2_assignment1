const persistence = require('./persistence.js')

/**
 * Validate user credentials
 * @param {string} username - username
 * @param {string} password - password
 * @returns {Promise<boolean>} true if valid, false otherwise
 */
/**
 * Validate user credentials and return the user object on success
 * @param {string} username - username
 * @param {string} password - password
 * @returns {Promise<Object|null>} user object if valid, otherwise null
 */
async function validateUser(username, password) {
    const users = await persistence.loadUsers()
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === username && users[i].password === password) {
            return users[i]
        }
    }
    return null
}

/**
 * Check whether the given user id owns the photo
 * @param {number} id - photo id
 * @param {number} userId - id of the user
 * @returns {Promise<boolean>} true if owner, false otherwise
 */
async function ownPhoto(id, userId) {
    const photo = await persistence.findPhotoById(id)
    if (!photo) {
        return false
    }
    return photo.owner === userId
}

/**
 * Get details for a photo by id
 * @param {number} id - photo id
 * @returns {Promise<Object|null>} details or null
 */
async function getPhotoDetails(id) {
    const photo = await persistence.findPhotoById(id)
    if (!photo) {
        return null
    }

    const albumIds = Array.isArray(photo.albums) ? photo.albums : []
    const albums = await persistence.getAlbumsByIds(albumIds)
    const albumNames = []
    for (let i = 0; i < albums.length; i++) {
        albumNames.push(albums[i].name)
    }

    return {
        fileName: photo.filename,
        title: photo.title,
        tags: Array.isArray(photo.tags) ? photo.tags : [],
        albumNames: albumNames,
        formattedDate: formatDate(photo.date),
        description: photo.description
    }
}

/**
 * Update a photo's title/description
 * @param {number} id - photo id
 * @param {string|null|undefined} title - new title or null/undefined to skip
 * @param {string|null|undefined} description - new description or null/undefined to skip
 * @returns {Promise<Object>} persistence result
 */
async function updatePhoto(id, title, description) {
    return await persistence.updatePhoto(id, title, description)
}

/**
 * Add a tag to a photo (business validation then persist)
 * @param {number} photoId - photo id
 * @param {string} tag - tag to add
 * @returns {Promise<Object>} result
 */
async function addTagToPhoto(photoId, tag) {
    if (!tag || typeof tag !== 'string' || tag.trim() === '') {
        return { success: false, message: 'Invalid tag' }
    }
    const photo = await persistence.findPhotoById(photoId)
    if (!photo) {
        return { success: false, message: 'Photo not found' }
    }
    const tags = Array.isArray(photo.tags) ? photo.tags : []
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].toLowerCase() === tag.toLowerCase()) {
            return { success: false, message: 'Tag already exists' }
        }
    }
    return await persistence.addTagToPhoto(photoId, tag)
}

/**
 * Build a CSV-like list of photos for an album name
 * @param {string} albumName - album name to search (case-insensitive exact)
 * @returns {Promise<Object>} { success, csv } or error message
 */
async function albumPhotoListCsv(albumName) {
    const matching = await persistence.findAlbumsByName(albumName)
    if (!matching || matching.length === 0) {
        return { success: false, message: 'Album not found: ' + albumName }
    }
    const albumIds = []
    for (let i = 0; i < matching.length; i++) {
        albumIds.push(matching[i].id)
    }
    const photos = await persistence.getPhotosByAlbumIds(albumIds)

    const lines = []
    lines.push('filename,resolution,tags')
    for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const filename = p.filename || ''
        const resolution = p.resolution || ''
        let tags = ''
        if (Array.isArray(p.tags)) {
            for (let j = 0; j < p.tags.length; j++) {
                if (j === 0) {
                    tags = p.tags[j]
                } else {
                    tags = tags + ':' + p.tags[j]
                }
            }
        }
        lines.push(filename + ',' + resolution + ',' + tags)
    }

    let csv = ''
    for (let i = 0; i < lines.length; i++) {
        if (i === 0) {
            csv = lines[i]
        } else {
            csv = csv + '\n' + lines[i]
        }
    }

    return { success: true, csv: csv }
}

/**
 * Format an ISO date string into 'Month D, YYYY'
 * @param {string} iso - ISO date string
 * @returns {string} formatted date or original input on failure
 */
function formatDate(iso) {
    try {
        const d = new Date(iso)
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        return monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
    } catch (e) {
        return iso
    }
}

module.exports = {
    getPhotoDetails,
    updatePhoto,
    addTagToPhoto,
    albumPhotoListCsv,
    formatDate,
    validateUser,
    ownPhoto
}