const mongoose = require('mongoose')

const { Schema } = mongoose

const GamesSchema = new Schema({
  homeTeam: {
    type: String,
    required: true,
    trim: true
  },
  outerTeam: {
    type: String,
    required: true,
    trim: true
  },
  date: Date,
  actions: [{
    type: Schema.Types.ObjectId,
    ref: 'Action'
  }],
  createdAt: Date
})

GamesSchema.pre('save', function (next) {
  this.createdAt = new Date()
  next()
})

mongoose.model('Game', GamesSchema)
