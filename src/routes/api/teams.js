const mongoose = require('mongoose')
const router = require('express').Router()
const auth = require('../auth')
const Team = mongoose.model('Team')

// Get all teams
router.get('/all', auth.required, (req, res, next) => {
  // Todo pagination
  Team.find({})
    .then(teamsArr => {
      res.status(200).send({ teams: teamsArr })
    })
    .catch(next)
})

// Create Team
router.post('/new', auth.required, (req, res, next) => {
  const { body: { team: { name } }, payload: { id } } = req
  const finalTeam = new Team({ name })
  finalTeam.coach = id
  finalTeam.save()
    .then(team => {
      Team.findById(team._id).populate('+coach').exec()
        .then(teamPop => {
          res.send({ team: teamPop })
        })
    })
    .catch(next)
})

// Get My Team
router.get('/', auth.required, (req, res, next) => {
  const { payload: { id } } = req
  Team.findOne({ 'coach': id }).populate({ path: 'coach', ref: 'User' }).exec()
    .then(team => {
      res.status(200).send({ team })
    })
    .catch(next)
})

// Update Team Data
router.patch('/:id', auth.required, (req, res, next) => {
  const { id } = req.params
  Team.findByIdAndUpdate(id, req.body.team)
    .then(() => {
      Team.findById(id)
        .then(team => {
          res.status(200).send({ team })
        })
        .catch(next)
    })
    .catch(next)
})

// Delete Team
router.delete('/:id', auth.required, (req, res, next) => {
  const { id } = req.params

  Team.findById(id)
    .then(team => {
      console.log(team)
      if (String(team.coach) === req.payload.id) {
        team.remove()
          .then(removedUser => {
            res.status(203).send({ removed: removedUser })
          })
          .catch(next)
      } else {
        res.sendStatus(401)
        next()
      }
    })
    .catch(next)
})

module.exports = router
