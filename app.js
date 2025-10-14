const express = require('express')
const expressHbs = require('express-handlebars')
const business = require('./business.js')

const app = express()
app.use(express.static('public'))
app.engine('hbs', expressHbs.engine({extname: '.hbs'}))
app.set('view engine', 'hbs')

app.use(express.urlencoded({extended: true}))














app.listen(8000, ()=>{
    console.log('Server started on http://localhost:8000')
})