const nodemailer = require('nodemailer')

const forgotPasswordMailer = function (token, user, done, res) {
  var smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.MAILER_EMAIL,
      pass: process.env.MAILER_PASSWORD
    }
  })
  const mailOptions = {
    to: user.email,
    from: process.env.MAILER_EMAIL,
    subject: 'TeamManager Password Reset',
    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
      process.env.CLIENT_URL + '/reset/' + token + '\n\n' +
      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  }
  smtpTransport.sendMail(mailOptions, err => {
    done(err, true)
    res.sendStatus(200)
  })
}

const resetPasswordMailer = function (user, done) {
  const smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.MAILER_EMAIL,
      pass: process.env.MAILER_PASSWORD
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

module.exports = {
  forgotPasswordMailer,
  resetPasswordMailer
}
