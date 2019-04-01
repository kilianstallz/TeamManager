const express = require('express')
const router = express.Router()

router.use('/o/auth', require('./users'))
router.use('/teams', require('./teams'))
router.use('/playermanagement', require('./players'))

module.exports = router
