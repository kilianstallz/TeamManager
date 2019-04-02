const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const session = require('express-session')
const cors = require('cors')
const mongoose = require('mongoose')
const errorHandler = require('errorhandler')

// Configure mongoose's promise to global promise
mongoose.promise = global.Promise

// Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production'

// Initiate our app
const app = express()

// Configure our app
app.use(cors())
app.use(require('morgan')('dev'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({ secret: process.env.SECRET, cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }))

if (!isProduction) {
  app.use(errorHandler())
}

// Configure Mongoose
mongoose.connect('mongodb://localhost:27017/teammanager', {
  // mongoose.connect('mongodb+srv://tm-dev-admin:tm-dev-admin@teammanager-csuqv.mongodb.net/test?retryWrites=true', {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true
})
mongoose.set('debug', true)

// Routes & Models
require('./models/Users.model')
require('./models/Team.model')
require('./models/Player.model')
require('./models/Game.model')
require('./models/Action.model')
require('./config/passport')
app.use(require('./routes'))

// Error handlers & middlewares
if (!isProduction) {
  app.use((err, req, res, next) => {
    res.status(err.status || 500).send({
      errors: {
        message: err.message,
        error: err
      }
    })
  })
}

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    errors: {
      message: err.message,
      error: {}
    }
  })
})

module.exports = app
