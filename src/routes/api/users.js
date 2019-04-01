const mongoose = require('mongoose')
const passport = require('passport')
const crypto = require('crypto')
const auth = require('../auth')
const async = require('async')
const nodemailer = require('nodemailer')
const router = require('express').Router()
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

router.post('/forgot', auth.optional, (req, res, next) => {
  console.log('forgot')
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
          return res.send(404).send({ errors: { message: 'No user found with this email!' } })
        }
        if (err) {
          return res.send(500).send({ errors: { error: err } })
        }
        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 36000000

        user.save(err => {
          done(err, token, user)
        })
      })
    },
    (token, user, done) => {
      var smtpTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: 'kp.stallinger@gmail.com',
          pass: 'Nailik#pi15'
        }
      })
      const mailOptions = {
        to: user.email,
        from: 'kp.stallinger@gmail.com',
        subject: 'TeamManager Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://localhost:8080/login?method=reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      }
      smtpTransport.sendMail(mailOptions, err => {
        done(err, true)
        res.sendStatus(200)
      })
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
          next(err)
        }
        console.log('User', user)
        user.setPassword(req.body.password)
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        user.save()
          .then(update => res.status(202).send(update))
      })
    },
    (user, done) => {
      const smtpTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: 'kp.stallinger@gmail.com',
          pass: 'Nailik#pi15'
        }
      })
      const mailOptions = {
        to: user.email,
        from: 'kp.stallinger@gmail.com',
        subject: 'Your password has been changed!',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      }
      smtpTransport.sendMail(mailOptions, err => {
        done(err, 'done')
        res.sendStatus(200)
      })
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
