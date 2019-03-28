const mongoose = require('mongoose')

const { Schema } = mongoose

const PlayersSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: Date
})

PlayersSchema.pre('save', function (next) {
  this.createdAt = new Date()
  next()
})

mongoose.model('Player', PlayersSchema)
