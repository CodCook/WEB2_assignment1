import promptSync from 'prompt-sync';
import { promises as fs } from 'fs';

const prompt = promptSync();

async function fetchData(fileName) {
    try {
        let photos = await fs.readFile(fileName, 'utf8')
        let data = JSON.parse(photos)
        return data

    } catch (error) {
        console.log("Error reading file:", error)
    }finally {
        console.log("Finished reading file")
    }
}

async function saveData(fileName, data) {
    try {
        await fs.writeFile(fileName, JSON.stringify(data, null, 2))
        console.log("Data saved successfully.")
    } catch (error) {
        console.log("Error writing file:", error)
    }finally {
        console.log("Finished writing file")
    }
}

async function FindPhoto(id){
    let photos = await fetchData('photos-Copy.json');
    for (let x of photos){
        if (x.id === id){
            return x;
        }
    }
    return null;
}

function AlbumPhotoList(){

}

function TagPhoto(){

}


while (true){
    console.log("Chose an option: ")
    console.log("1. Find a photo")
    console.log("2. Update a photo")
    console.log("3. Album Photo list")
    console.log("4. Tag Photo")
    console.log("5. Exit")

    let selection = Number(prompt("Enter your choice: "))

    if (selection === 1){
        const photoId = Number(prompt("Enter photo ID: "))
        let photo = await FindPhoto(photoId)
        if (photo === null){
            console.log("No photo found in the file!")
        }else{
            console.log(`File name: ${photo.filename}, Title: ${photo.title}, Data: ${photo.date}, AlbumList: ${photo.albums}, Tags: ${photo.tags}`)
        }
    }else if (selection === 2){
        const photoId = Number(prompt("Enter photo ID to update: "));
        let photo = await FindPhoto(photoId);
        if (!photo) {
            console.log("No photo found with that ID!");
        } else {
            console.log("Press enter to reuse existing value.");
            console.log(`Current title: ${photo.title}`);
            let newTitle = prompt("Enter new title (press enter to keep current): ");
            if (newTitle.trim() !== "") {
                photo.title = newTitle;
            }
            console.log(`Current description: ${photo.description}`);
            let newDesc = prompt("Enter new description (press enter to keep current): ");
            if (newDesc.trim() !== "") {
                photo.description = newDesc;
            }
            await saveData('photos.json', photo);
            console.log("Photo details updated!");
        }
    }else if (selection === 3){
        AlbumPhotoList()
    }else if (selection === 4){
        TagPhoto()
    }else if (selection === 5){
        break
    }else {
        console.log("Invalid choice, please Enter a valid number (1-5).")
    }
}