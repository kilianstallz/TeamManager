const mongoose = require('mongoose')
const passport = require('passport')
const router = require('express').Router()
const auth = require('../auth')
const User = mongoose.model('User')

// POST new user route (optional, open route)
router.post('/', auth.optional, (req, res, next) => {
  const { body: { user } } = req

  if (!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    })
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    })
  }

  const finalUser = new User(user)
  finalUser.setPassword(user.password)
  return finalUser.save()
    .then(() => res.json({ user: finalUser.toAuthJSON() }))
    .catch(next)
})

// POST login route (optional, open route)
router.post('/login', auth.optional, (req, res, next) => {
  const { body: { user } } = req

  if (!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    })
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    })
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if (err) {
      return next(err)
    }
    if (passportUser) {
      const user = passportUser
      user.token = passportUser.generateJWT()

      return res.json({ user: user.toAuthJSON() })
    }
    // Maybe without res
    return res.send({ info })
  })(req, res, next)
})

// GET current route (required, auth required)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req

  return User.findById(id)
    .then(user => {
      if (!user) {
        return res.sendStatus(400)
      }
      return res.json({ user: user.toAuthJSON() })
    })
    .catch(next)
})

// GET full Profile route (required, auth required)
router.get('/me', auth.required, (req, res, next) => {
  const { payload: { id } } = req

  return User.findById(id).populate({ path: 'team', ref: 'Team' }).exec()
    .then(user => {
      if (!user) {
        return res.sendStatus(400)
      }
      return res.json({ user })
    })
    .catch(next)
})

// PATCH user profile, (required, auth required)
router.patch('/', auth.required, (req, res, next) => {
  const { payload: { id } } = req
  User.findByIdAndUpdate(id, req.body)
    .then(() => {
      User.findById(id)
        .then(user => {
          res.status(200).send({ user })
        })
        .catch(next)
    })
    .catch(next)
})

// DELETE User (required)
router.delete('/', auth.required, (req, res, next) => {
  const { payload: { id } } = req
  User.findById(id)
    .then(user => {
      user.remove()
        .then(removedUser => {
          res.status(203).send({ user: removedUser })
        })
        .catch(next)
    })
    .catch(next)
})

module.exports = router
