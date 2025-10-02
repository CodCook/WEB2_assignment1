// Mahgoub mohamed / 60304062

// quick input helper (prompt-sync)
const promptSync = require('prompt-sync')
// import business logic functions
const business = require('./business.js')

// create a prompt() function to ask the user stuff in the terminal
const prompt = promptSync()

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
            console.log("\n--- Find a Photo ---")
            const photoIdInput = prompt("Enter the ID of the photo you want to find: ")
            const photoIdToFind = Number(photoIdInput)
            
            if (isNaN(photoIdToFind)) {
                console.log("Invalid ID. Please enter a number.")
            } else {
                const result = await business.findPhoto(photoIdToFind)
                if (result.success) {
                    const photo = result.photo
                    const date = new Date(photo.date)
                    const readableDate = date.toDateString()
                    console.log(`\nFilename: ${photo.filename}`)
                    console.log(`Title: ${photo.title}`)
                    console.log(`Date: ${readableDate}`)
                    console.log(`Albums: ${photo.albumNames.join(', ')}`)
                    console.log(`Tags: ${photo.tags.join(', ')}`)
                } else {
                    console.log(result.message)
                }
            }
        } else if (selection === 2) {
            console.log("\n--- Update Photo Details ---")
            const photoIdInput = prompt("Enter the ID of the photo you want to update: ")
            const photoIdToUpdate = Number(photoIdInput)
            
            if (isNaN(photoIdToUpdate)) {
                console.log("Invalid ID. Please enter a number.")
            } else {
                const result = await business.getPhotoForUpdate(photoIdToUpdate)
                if (result.success) {
                    const photo = result.photo
                    console.log("Press Enter to keep the current value.")
                    const newTitle = prompt(`New title [${photo.title}]: `)
                    const newDescription = prompt(`New description [${photo.description}]: `)
                    
                    const updateResult = await business.updatePhotoDetails(photoIdToUpdate, newTitle, newDescription)
                    console.log(updateResult.message)
                } else {
                    console.log(result.message)
                }
            }
        } else if (selection === 3) {
            console.log("\n--- List Photos in an Album ---")
            const albumNameInput = prompt("Enter the name of the album: ")
            
            const result = await business.listAlbumPhotos(albumNameInput)
            if (result.success) {
                console.log("\nfilename,resolution,tags")
                for (const photo of result.photos) {
                    const tagsText = photo.tags.join(":")
                    console.log(`${photo.filename},${photo.resolution},${tagsText}`)
                }
            } else {
                console.log(result.message)
            }
        } else if (selection === 4) {
            console.log("\n--- Add a Tag to a Photo ---")
            const photoIdInput = prompt("Enter the ID of the photo to tag: ")
            const photoIdToTag = Number(photoIdInput)
            
            if (isNaN(photoIdToTag)) {
                console.log("Invalid ID. Please enter a number.")
            } else {
                const newTag = prompt("Enter the new tag to add: ")
                const result = await business.addTagToPhoto(photoIdToTag, newTag)
                console.log(result.message)
            }
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