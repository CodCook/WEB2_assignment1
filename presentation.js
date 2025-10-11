const promptSync = require('prompt-sync')()
const business = require('./business.js')


/**
 * Display the main menu to the user
 */
function showMenu() {
    console.log('\nPhoto Manager')
    console.log('1. Find Photo')
    console.log('2. Update Photo Details')
    console.log('3. Album Photo List')
    console.log('4. Tag Photo')
    console.log('5. Exit')
}

/**
 * Prompt the user for a numeric selection
 * @returns {number} selected option
 */
function readSelection() {
    const input = promptSync('Your selection> ')
    const num = parseInt(input, 10)
    if (isNaN(num)) {
        return -1
    }
    return num
}

/**
 * Handle the "Find Photo" menu option
 */
async function handleFindPhoto() {
    const input = promptSync('Enter photo id: ')
    const id = parseInt(input, 10)
    if (isNaN(id)) {
        console.log('Invalid id')
        return
    }
    try {
        const details = await business.getPhotoDetails(id)
        if (!details) {
            console.log('Photo not found')
            return
        }
        // login removed: do not check ownership here
        console.log('\nPhoto Details:')
        console.log('Filename: ' + details.fileName)
        console.log('Title: ' + details.title)
        console.log('Description: ' + details.description)
        console.log('Date: ' + details.formattedDate)
        console.log('Tags: ' + (Array.isArray(details.tags) ? details.tags.join(',') : ''))
        console.log('Albums: ' + (Array.isArray(details.albumNames) ? details.albumNames.join(',') : ''))
    } catch (e) {
        console.log('An error occurred while retrieving photo details')
    }
}

/**
 * Handle updating photo details
 */
async function handleUpdatePhoto() {
    const input = promptSync('Enter photo id: ')
    const id = parseInt(input, 10)
    if (isNaN(id)) {
        console.log('Invalid id')
        return
    }
    const photo = await business.getPhotoDetails(id)
    const title = promptSync(`Enter new title for ${photo.title} (leave blank to keep): `)
    const description = promptSync(`Enter new description for ${photo.description} (leave blank to keep): `)
    // convert blank input to undefined so persistence will skip
    const newTitle = title === '' ? undefined : title
    const newDescription = description === '' ? undefined : description
    try {
        const res = await business.updatePhoto(id, newTitle, newDescription)
        if (res && res.success) {
            console.log('Photo updated')
        } else {
            console.log('Photo not found or update failed')
        }
    } catch (e) {
        console.log('An error occurred while updating photo')
    }
}

/**
 * Handle album photo list CSV
 */
async function handleAlbumPhotoList() {
    const albumName = promptSync('Enter album name: ')
    if (!albumName || albumName.trim() === '') {
        console.log('Invalid album name')
        return
    }
    try {
        const res = await business.albumPhotoListCsv(albumName)
        if (!res || !res.success) {
            console.log('Album not found')
            return
        }
        console.log('\nCSV Output:\n' + res.csv)
    } catch (e) {
        console.log('An error occurred while generating album list')
    }
}

/**
 * Handle adding a tag to a photo
 */
async function handleTagPhoto() {
    const input = promptSync('Enter photo id: ')
    const id = parseInt(input, 10)
    if (isNaN(id)) {
        console.log('Invalid id')
        return
    }
    const tag = promptSync('Enter tag to add: ')
    if (!tag || tag.trim() === '') {
        console.log('Invalid tag')
        return
    }
    try {
        const res = await business.addTagToPhoto(id, tag)
        if (res && res.success) {
            console.log('Tag added')
        } else {
            console.log('Could not add tag: ' + (res && res.message ? res.message : 'unknown'))
        }
    } catch (e) {
        console.log('An error occurred while tagging photo')
    }
}

/**
 * Main program loop
 */
async function main() {
    let shouldExit = false
    while (!shouldExit) {
        showMenu()
        const sel = readSelection()
        switch (sel) {
            case 1:
                await handleFindPhoto()
                break
            case 2:
                await handleUpdatePhoto()
                break
            case 3:
                await handleAlbumPhotoList()
                break
            case 4:
                await handleTagPhoto()
                break
            case 5:
                shouldExit = true
                break
            default:
                console.log('Invalid selection')
        }
    }
    console.log('Goodbye')
}

/**
 * Start the application: perform login then enter main loop
 */
async function start() {
    // login removed: start application directly
    await main()
}

start()