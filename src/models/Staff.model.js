const mongoose = require('mongoose')

const { Schema } = mongoose

const StaffSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: Date
})

StaffSchema.pre('save', function (next) {
  this.createdAt = new Date()
  next()
})

mongoose.model('Staff', StaffSchema)
