const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const User = mongoose.model('User')

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, (email, password, done) => {
  User.findOne({ email }).select('+salt +hash').exec()
    .then(user => {
      if (!user || !user.validatePassword(password)) {
        return done(null, false, { errors: { message: 'Email or Password is invalid' } })
      }
      return done(null, user)
    })
    .catch(done)
}))
