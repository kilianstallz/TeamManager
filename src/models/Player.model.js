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
  phone: String,
  address: String,
  position: Object,
  createdAt: Date,
  updatedAt: Date
})

PlayersSchema.pre('save', function (next) {
  this.createdAt = new Date()
  next()
})

mongoose.model('Player', PlayersSchema)
