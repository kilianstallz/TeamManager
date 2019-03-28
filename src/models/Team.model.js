const mongoose = require('mongoose')

const { Schema } = mongoose

const TeamsSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  coach: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sports: {
    type: String,
    enum: ['Football', 'Running']
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player',
    default: []
  }],
  games: [{
    type: Schema.Types.ObjectId,
    ref: 'Game'
  }],
  // staff: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'Staff'
  // }],
  createdAt: Date
})

TeamsSchema.pre('save', function (next) {
  this.createdAt = new Date()
  next()
})

mongoose.model('Team', TeamsSchema)
