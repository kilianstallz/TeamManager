const express = require('express')
const router = express.Router()

router.use('/users', require('./users'))
router.use('/teams', require('./teams'))
router.use('/players', require('./players'))

module.exports = router
