// Mahgoub mohamed / 60304062

// quick input helper (prompt-sync)
import promptSync from 'prompt-sync'
// node fs promises so we can read/write json files with async/await
import { promises as fs } from 'fs'

// create a prompt() function to ask the user stuff in the terminal
const prompt = promptSync()

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
        console.log(`Error: Could not load the file named '${fileName}'.`)
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
        console.log(`Error: Could not save the file named '${fileName}'.`)
        return false
    }
}

/**
 * Finds a specific photo by its ID and displays its details.
 * @returns {Promise<void>} This function does not return a value.
 */
async function findPhoto() {
    console.log("\n--- Find a Photo ---")
    const photoIdInput = prompt("Enter the ID of the photo you want to find: ")
    const photoIdToFind = Number(photoIdInput)

    if (isNaN(photoIdToFind)) {
        console.log("Invalid ID. Please enter a number.")
        return
    }

    let photosData = await loadFile('photos.json')
    const allAlbums = await loadFile('albums.json')

    if (!photosData || !allAlbums) return

    // If photos.json is an object, convert it to an array with one element
    if (photosData && !Array.isArray(photosData)) {
        photosData = [photosData];
    }

    let photoFound = null
    for (let i = 0; i < photosData.length; i++) {
        if (photosData[i].id === photoIdToFind) {
            photoFound = photosData[i]
            break
        }
    }

    if (photoFound) {
        const albumNames = []
        for (let i = 0; i < photoFound.albums.length; i++) {
            const albumId = photoFound.albums[i]
            for (let j = 0; j < allAlbums.length; j++) {
                if (allAlbums[j].id === albumId) {
                    albumNames.push(allAlbums[j].name)
                }
            }
        }
        const date = new Date(photoFound.date)
        const readableDate = date.toDateString()
        console.log(`\nFilename: ${photoFound.filename}`)
        console.log(`Title: ${photoFound.title}`)
        console.log(`Date: ${readableDate}`)
        console.log(`Albums: ${albumNames.join(', ')}`)
        console.log(`Tags: ${photoFound.tags.join(', ')}`)
    } else {
        console.log("Sorry, a photo with that ID could not be found.")
    }
}

/**
 * Updates the title and description of a photo identified by its ID.
 * @returns {Promise<void>} This function does not return a value.
 */
async function updatePhotoDetails() {
    console.log("\n--- Update Photo Details ---")
    const photoIdInput = prompt("Enter the ID of the photo you want to update: ")
    const photoIdToUpdate = Number(photoIdInput)

    if (isNaN(photoIdToUpdate)) {
        console.log("Invalid ID. Please enter a number.")
        return
    }

    let photosData = await loadFile('photos.json')
    if (!photosData) return

    const isSingleObject = !Array.isArray(photosData);
    let photosArray = isSingleObject ? [photosData] : photosData;

    let photoIndex = -1
    for (let i = 0; i < photosArray.length; i++) {
        if (photosArray[i].id === photoIdToUpdate) {
            photoIndex = i
            break
        }
    }

    if (photoIndex === -1) {
        console.log("Sorry, a photo with that ID could not be found.")
    } else {
        const photo = photosArray[photoIndex]
        console.log("Press Enter to keep the current value.")

        const newTitle = prompt(`Enter value for title [${photo.title}]: `)
        if (newTitle !== "") {
            photo.title = newTitle
        }

        const newDescription = prompt(`Enter value for description [${photo.description}]: `)
        if (newDescription !== "") {
            photo.description = newDescription
        }

        const dataToSave = isSingleObject ? photosArray[0] : photosArray;
        await saveFile('photos.json', dataToSave)
        console.log("Photo updated")
    }
}

/**
 * Lists all photos belonging to a specific album in a CSV-like format.
 * @returns {Promise<void>} This function does not return a value.
 */
async function listAlbumPhotos() {
    console.log("\n--- Album Photo List ---")
    const albumNameInput = prompt("What is the name of the album? ").toLowerCase()

    let photosData = await loadFile('photos.json')
    const allAlbums = await loadFile('albums.json')
    if (!photosData || !allAlbums) return

    if (photosData && !Array.isArray(photosData)) {
        photosData = [photosData];
    }

    let albumId = -1
    for (let i = 0; i < allAlbums.length; i++) {
        if (allAlbums[i].name.toLowerCase() === albumNameInput) {
            albumId = allAlbums[i].id
            break
        }
    }

    if (albumId === -1) {
        console.log("Sorry, an album with that name could not be found.")
    } else {
        console.log("\nfilename,resolution,tags")
        for (let i = 0; i < photosData.length; i++) {
            const photo = photosData[i]
            if (photo.albums.includes(albumId)) {
                const tagsText = photo.tags.join(":")
                const resolutionText = Array.isArray(photo.resolution) ? photo.resolution.join('x') : photo.resolution;
                console.log(`${photo.filename},${resolutionText},${tagsText}`)
            }
        }
    }
}

/**
 * Adds a new tag to a photo, preventing duplicates.
 * @returns {Promise<void>} This function does not return a value.
 */
async function addTagToPhoto() {
    console.log("\n--- Add Tag to Photo ---")
    const photoIdInput = prompt("What photo ID to tag? ")
    const photoIdToTag = Number(photoIdInput)

    if (isNaN(photoIdToTag)) {
        console.log("Invalid ID. Please enter a number.")
        return
    }

    let photosData = await loadFile('photos.json')
    if (!photosData) return

    const isSingleObject = !Array.isArray(photosData);
    let photosArray = isSingleObject ? [photosData] : photosData;

    let photoIndex = -1
    for (let i = 0; i < photosArray.length; i++) {
        if (photosArray[i].id === photoIdToTag) {
            photoIndex = i
            break
        }
    }

    if (photoIndex === -1) {
        console.log("Sorry, a photo with that ID could not be found.")
    } else {
        const photo = photosArray[photoIndex]
        const newTag = prompt(`What tag to add (${photo.tags.join(',')})? `)

        let tagAlreadyExists = false
        for (let i = 0; i < photo.tags.length; i++) {
            if (photo.tags[i].toLowerCase() === newTag.toLowerCase()) {
                tagAlreadyExists = true
                break
            }
        }

        if (tagAlreadyExists) {
            console.log(`The tag "${newTag}" already exists on this photo.`)
        } else {
            photo.tags.push(newTag)
            const dataToSave = isSingleObject ? photosArray[0] : photosArray;
            await saveFile('photos.json', dataToSave)
            console.log("Updated!")
        }
    }
}

/**
 * The main function to run the menu-driven console application.
 * @returns {Promise<void>} This function does not return a value.
 */
async function main() {
    while (true) {
        console.log("\n----- Photo App Menu -----")
        console.log("1. Find Photo")
        console.log("2. Update Photo Details")
        console.log("3. Album Photo List")
        console.log("4. Tag Photo")
        console.log("5. Exit")

        const choice = prompt("Your selection> ")
        const selection = Number(choice)

        if (selection === 1) {
            await findPhoto()
        } else if (selection === 2) {
            await updatePhotoDetails()
        } else if (selection === 3) {
            await listAlbumPhotos()
        } else if (selection === 4) {
            await addTagToPhoto()
        } else if (selection === 5) {
            console.log("Goodbye!")
            break
        } else {
            console.log("Invalid choice. Please enter a number between 1 and 5.")
        }
    }
}

// This is the line that officially starts our program
main()