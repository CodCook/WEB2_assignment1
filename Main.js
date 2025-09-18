// quick input helper (prompt-sync)
import promptSync from 'prompt-sync'
// node fs promises so we can read/write json files with async/await
import { promises as fs } from 'fs'

// create a prompt() function to ask the user stuff in the terminal
const prompt = promptSync()

// load a JSON file and parse it. returns object/array or null on error
async function loadFile(fileName) {
    try {
        const fileContent = await fs.readFile(fileName, 'utf8')
        return JSON.parse(fileContent)
    } catch (error) {
        console.log(`Error: Could not load the file named '${fileName}'.`)
        return null
    }
}

// save an object/array back to a JSON file. returns true/false
async function saveFile(fileName, data) {
    try {
        const fileContent = JSON.stringify(data, null, 2)
        await fs.writeFile(fileName, fileContent)
        return true
    } catch (error) {
        console.log(`Error: Could not save the file named '${fileName}'.`)
        return false
    }
}

// main loop for the app. shows a menu and handles user choices
async function main() {
    while (true) {
    // --- menu ---
        console.log("\n----- Photo App Menu -----")
        console.log("1. Find a Photo")
        console.log("2. Update Photo Details")
        console.log("3. List Photos in an Album")
        console.log("4. Add a Tag to a Photo")
        console.log("5. Exit")

    // --- ask the user for a choice ---
        const choice = prompt("Please enter your choice (1-5): ")
        const selection = Number(choice)

    // --- handle the chosen option ---
    // CHOICE 1: find and display the photo with a given id
        if (selection === 1) {
            console.log("\n--- Find a Photo ---")
            const photoIdInput = prompt("Enter the ID of the photo you want to find: ")
            // convert input to a number so comparisons work
            const photoIdToFind = Number(photoIdInput)

            // validate the number
            if (isNaN(photoIdToFind)) {
                console.log("Invalid ID. Please enter a number.")
            } else {
                // our photos file is a single object (not an array)
                const photo = await loadFile('photos.json')
                const allAlbums = await loadFile('albums.json')
                if (photo.id === photoIdToFind) {
                    const albumNames = []
                    for (let j = 0; j < photo.albums.length; j++) {
                        const albumId = photo.albums[j]
                        for (let k = 0; k < allAlbums.length; k++) {
                            if (allAlbums[k].id === albumId) {
                                albumNames.push(allAlbums[k].name)
                            }
                        }
                    }
                    const date = new Date(photo.date)
                    const readableDate = date.toDateString()
                    console.log(`\nFilename: ${photo.filename}`)
                    console.log(`Title: ${photo.title}`)
                    console.log(`Date: ${readableDate}`)
                    console.log(`Albums: ${albumNames.join(', ')}`)
                    console.log(`Tags: ${photo.tags.join(', ')}`)
                } else {
                    console.log("Sorry, a photo with that ID could not be found.")
                }
            }
        }

    // CHOICE 2: update title / description of the single photo object
        else if (selection === 2) {
            console.log("\n--- Update Photo Details ---")
            const photoIdInput = prompt("Enter the ID of the photo you want to update: ")
            // convert input to number before comparing
            const photoIdToUpdate = Number(photoIdInput)
            
            if (isNaN(photoIdToUpdate)) {
                 console.log("Invalid ID. Please enter a number.")
            } else {
                let photo = await loadFile('photos.json')
                if (photo.id !== photoIdToUpdate) {
                    console.log("Sorry, a photo with that ID could not be found.")
                } else {
                    // show current values and allow empty input to skip
                    console.log("Press Enter to keep the current value.")
                    const newTitle = prompt(`New title [${photo.title}]: `)
                    if (newTitle !== "") {
                        photo.title = newTitle
                    }
                    const newDescription = prompt(`New description [${photo.description}]: `)
                    if (newDescription !== "") {
                        photo.description = newDescription
                    }
                    // save the updated photo object
                    await saveFile('photos.json', photo)
                    console.log("Photo has been updated successfully!")
                }
            }
        }

    // CHOICE 3: print a CSV-like list of photos in a named album
        else if (selection === 3) {
            console.log("\n--- List Photos in an Album ---")
            // ask album name (case-insensitive)
            const albumNameInput = prompt("Enter the name of the album: ").toLowerCase()
            const photo = await loadFile('photos.json')
            const allAlbums = await loadFile('albums.json')
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
                // header line - easy to copy/paste into Excel
                console.log("\nfilename,resolution,tags")
                if (photo.albums.includes(albumId)) {
                    const tagsText = photo.tags.join(":")
                    console.log(`${photo.filename},${photo.resolution},${tagsText}`)
                }
            }
        }

    // CHOICE 4: add a tag to the photo (avoids duplicates)
        else if (selection === 4) {
            console.log("\n--- Add a Tag to a Photo ---")
            const photoIdInput = prompt("Enter the ID of the photo to tag: ")
            // convert to number for comparison
            const photoIdToTag = Number(photoIdInput)

            if(isNaN(photoIdToTag)){
                console.log("Invalid ID. Please enter a number.")
            } else {
                let photo = await loadFile('photos.json')
                if (photo.id !== photoIdToTag) {
                    console.log("Sorry, a photo with that ID could not be found.")
                } else {
                    const newTag = prompt("Enter the new tag to add: ")
                    // simple case-insensitive check
                    let tagAlreadyExists = false
                    for(let i = 0; i < photo.tags.length; i++){
                        if(photo.tags[i].toLowerCase() === newTag.toLowerCase()){
                            tagAlreadyExists = true
                            break
                        }
                    }
                    if (tagAlreadyExists) {
                        console.log(`The tag \"${newTag}\" already exists on this photo.`)
                    } else {
                        photo.tags.push(newTag)
                        await saveFile('photos.json', photo)
                        console.log("Tag added successfully!")
                    }
                }
            }
        }

        // CHOICE 5: Exit the program
        else if (selection === 5) {
            console.log("Goodbye!")
            break
        }

        // Handle invalid numbers
        else {
            console.log("Invalid choice. Please enter a number between 1 and 5.")
        }
    }
}

// This is the line that officially starts our program
main()