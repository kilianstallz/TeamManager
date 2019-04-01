const mongoose = require('mongoose')
const passport = require('passport')
const router = require('express').Router()
const auth = require('../auth')
const User = mongoose.model('User')

// POST new user route (optional, open route)
router.post('/signup', auth.optional, (req, res, next) => {
  const { body: { user } } = req
  console.log(user)
  if (!user.email) {
    return res.status(422).json({
      errors: {
        message: 'Email is required'
      }
    })
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        message: 'Password is required'
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
router.post('/login', auth.optional, async (req, res, next) => {
  const { body: { user } } = req

  if (!user.email) {
    return res.status(422).json({
      errors: {
        message: 'Email is required'
      }
    })
  }

  if (!user.password) {
    return res.status(422).json({
      errors: {
        message: 'Password is required'
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
    return res.status(401).send({ info })
  })(req, res, next)
})

// GET current route (required, auth required)
router.get('/', auth.required, (req, res, next) => {
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
router.patch('/me', auth.required, (req, res, next) => {
  const { payload: { id } } = req
  User.findById(id)
    .then(user => {
      if (!user) return res.sendStatus(404)
      user.set(req.body.user)
      user.save()
        .then(updatedUser => {
          res.status(200).send({ user: updatedUser })
        })
    })
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
