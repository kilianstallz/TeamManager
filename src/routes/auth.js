const jwt = require('express-jwt')

const getTokenFromHeaders = (req) => {
  let token = req.headers['x-access-token'] || req.headers['authorization']

  if (token) {
    if (token.startsWith('Bearer ')) {
      // remove Bearer from string
      token = token.slice(7, token.length)
      return token
    } else {
      return token
    }
  }
  return null
}

const auth = {
  required: jwt({
    secret: process.env.SECRET,
    userProperty: 'payload',
    getToken: getTokenFromHeaders
  }),
  optional: jwt({
    secret: process.env.SECRET,
    userProperty: 'payload',
    getToken: getTokenFromHeaders,
    credentialsRequired: false
  })
}

module.exports = auth
