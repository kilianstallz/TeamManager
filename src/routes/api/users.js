const mongoose = require('mongoose')
const passport = require('passport')
const crypto = require('crypto')
const auth = require('../auth')
const async = require('async')
const router = require('express').Router()
const User = mongoose.model('User')

const { forgotPasswordMailer, resetPasswordMailer } = require('../../config/nodemailer')

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

/*
  @route
    /forgot
  @auth
    none
  @body
    email[Object]
  @return
    status: 200
  @special
    Sends Email to registered user
*/
router.post('/forgot', auth.optional, (req, res, next) => {
  async.waterfall([
    done => {
      crypto.randomBytes(20, (err, buf) => {
        const token = buf.toString('hex')
        done(err, token)
      })
    },
    (token, done) => {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (!user) {
          return res.status(404).send({ errors: { message: 'No user found with this email!' } })
        }
        if (err) {
          return res.status(500).send({ errors: { error: err } })
        }
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 36000000

        user.save(err => {
          done(err, token, user)
        })
      })
    },
    (token, user, done) => {
      forgotPasswordMailer(token, user, done, res)
    }
  ], err => {
    if (err) return next(err)
  })
})

router.post('/reset/:token', auth.optional, (req, res, next) => {
  async.waterfall([
    done => {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: new Date(Date.now()) } }).exec(function (err, user) {
        if (!user) {
          return res.status(404).send({ errors: { message: 'Token is invalid or has expired.' } })
        }
        if (err) {
          return next(err)
        }
        user.setPassword(req.body.password)
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        user.save()
          .then(update => res.status(202).send(update))
      })
    },
    (user, done) => {
      resetPasswordMailer(user, done)
    }
  ], err => {
    next(err)
  })
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
