const mongoose = require('mongoose')

const { Schema } = mongoose

const ActionsSchema = new Schema({
  playerInvolved: {
    type: Schema.Types.ObjectId,
    ref: 'Player'
  },
  gameTime: Number,
  typeOfAction: {
    type: String
  },
  createdAt: Date
})

ActionsSchema.pre('save', function (next) {
  this.createdAt = new Date()
  next()
})

mongoose.model('Action', ActionsSchema)
