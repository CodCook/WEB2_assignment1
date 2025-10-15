const express = require('express')
const expressHbs = require('express-handlebars')
const business = require('./business.js')

const app = express()
app.use(express.static('public'))
app.engine('hbs', expressHbs.engine({extname: '.hbs'}))
app.set('view engine', 'hbs')

app.use(express.urlencoded({extended: true}))

app.get('/', async (req , res) => {
    const albums = await business.loadAlbums()
    res.render('home', {albums: albums, layout: undefined})
})

app.get('/albums/:id', async (req, res) => {
    const id = req.params.id
    const details = await business.getAlbumDetails(id)
    if (!details) {
        res.status(404).send('Album not found')
        return
    }
    res.render('albumDetails', { album: details.album, photos: details.photos, layout: undefined })
})

app.get('/photos/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        res.status(400).send('Invalid photo id')
        return
    }

    const photo = await business.getPhotoDetails(id)
    if (!photo) {
        res.status(404).send('Photo not found')
        return
    }
    res.render('photoDetails', { photo: photo, layout: undefined })
})

app.get('/edit/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        res.status(400).send('Invalid photo id')
        return
    }
    const photo = await business.getPhotoDetails(id)
    if (!photo) {
        res.status(404).send('Photo not found')
        return
    }
    res.render('editPhoto', { photo: photo, layout: undefined })
})

app.post('/edit-photo/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        res.status(400).send('Invalid photo id')
        return
    }
    const title = req.body.title
    const description = req.body.description
    try {
        const result = await business.updatePhoto(id, title, description)
        console.log('Update result:', result)
        if (result && result.success) {
            res.redirect(`/photos/${id}`)
        } else {
            res.status(500).send('Error updating photo')
        }
    } catch (error) {
        console.error(error)
        res.status(500).send('Error updating photo')
    }
})






app.listen(8000, ()=>{
    console.log('Server started on http://localhost:8000')
})