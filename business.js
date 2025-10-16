const persistence = require('./persistence.js')
const fs = require('fs/promises')
const path = require('path')

/**
 * Get details for a photo by id and resolve a public URL for the file.
 * @param {number} id - photo id
 * @returns {Promise<Object|null>} details object with fields: id, filename, url, title, tags, albumNames, formattedDate, description; or null if not found
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

    // determine public URL for the photo file; fall back to placeholder if missing
    let publicUrl = '/photos/placeholder.svg'
    if (photo.filename) {
        // try the exact filename first, then try common alternative extensions (svg, png, jpg)
        const candidates = [photo.filename]
        const base = photo.filename.replace(/\.[^.]+$/, '')
        candidates.push(base + '.svg')
        candidates.push(base + '.png')
        candidates.push(base + '.jpg')
        candidates.push(base + '.jpeg')
        for (let i = 0; i < candidates.length; i++) {
            const fn = candidates[i]
            const publicPath = path.join(process.cwd(), 'public', 'photos', fn)
            try {
                const st = await fs.stat(publicPath)
                if (st && st.isFile()) {
                    publicUrl = '/photos/' + fn
                    break
                }
            } catch (e) {
                // not found, try next
            }
        }
    }

    return {
        id: photo.id,
        filename: photo.filename,
        url: publicUrl,
        title: photo.title,
        tags: Array.isArray(photo.tags) ? photo.tags : [],
        albumNames: albumNames,
        formattedDate: formatDate(photo.date),
        description: photo.description
    }
}

/**
 * Update a photo's title/description via persistence layer and normalize the result.
 * @param {number} id - photo id
 * @param {string|null|undefined} title - new title or null/undefined to skip
 * @param {string|null|undefined} description - new description or null/undefined to skip
 * @returns {Promise<Object>} { success: boolean }
 */
async function updatePhoto(id, title, description) {
    const res = await persistence.updatePhoto(id, title, description)
    if (res && typeof res === 'object' && 'success' in res) {
        return res
    }
    // normalize legacy truthy/falsy
    return { success: !!res }
}

/**
 * Load all albums (delegates to persistence).
 * @returns {Promise<Array>} list of album objects
 */
async function loadAlbums(){
    return await persistence.getAllAlbums()
}

/**
 * Get album details and its photos by album id or name.
 * Accepts numeric id or album name string.
 * @param {string|number} idOrName - album id (number) or album name (string)
 * @returns {Promise<Object|null>} { album, photos } or null if not found
 */
async function getAlbumDetails(idOrName) {
    // try numeric id first
    const albums = await persistence.getAllAlbums()
    let found = null
    if (typeof idOrName === 'number' || !isNaN(parseInt(idOrName, 10))) {
        const id = parseInt(idOrName, 10)
        for (let i = 0; i < albums.length; i++) {
            if (albums[i].id === id) {
                found = albums[i]
                break
            }
        }
    }
    // fallback: match by name (case-insensitive)
    if (!found) {
        const target = ('' + idOrName).toLowerCase()
        for (let i = 0; i < albums.length; i++) {
            if (albums[i].name && albums[i].name.toLowerCase() === target) {
                found = albums[i]
                break
            }
        }
    }
    if (!found) {
        return null
    }
    const photos = await persistence.getPhotosByAlbumIds([found.id])
    return { album: found, photos: photos }
}

/**
 * Add a tag to a photo (business validation then persist).
 * @param {number} photoId - photo id
 * @param {string} tag - tag to add
 * @returns {Promise<Object>} result ({ success: boolean, message?: string })
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
 * Build a CSV-like list of photos for an album name.
 * @param {string} albumName - album name to search (case-insensitive exact)
 * @returns {Promise<Object>} { success: boolean, csv?: string, message?: string }
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
 * Format an ISO date string into 'Month D, YYYY'. If parsing fails the original value is returned.
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
    loadAlbums
    ,getAlbumDetails
}