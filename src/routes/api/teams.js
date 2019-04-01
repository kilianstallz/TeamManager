const mongoose = require('mongoose')
const router = require('express').Router()
const auth = require('../auth')
const Team = mongoose.model('Team')
const User = mongoose.model('User')

// Create Team
router.post('/action/new', auth.required, async (req, res, next) => {
  const { body: { team: { name } }, payload: { id } } = req
  // Checks if userId is given correctly
  if (id) {
    // Finds the user to check if he allready owns a team
    User.findById(id)
      .then(user => {
        // If so return an error
        if (user.team) return res.status(500).send({ errors: { message: 'You already own a team...' } })
        else {
          // else Create and initialize new team with its name
          const finalTeam = new Team({ name })
          finalTeam.coach = id // Store the coach Id
          user.team = finalTeam._id
          user.save()
          finalTeam.save()
            .then(savedTeam => {
              res.status(201).send({ team: savedTeam })
            })
            .catch(next)
        }
      })
      .catch(next)
  } else {
    res.sendStatus(401)
    next()
  }
})

// Get My Team
router.get('/get/myTeam', auth.required, async (req, res, next) => {
  const { payload: { id } } = req
  Team.findOne({ 'coach': id }).exec()
    .then(team => {
      res.status(200).send({ team })
    })
    .catch(next)
})

// Get all teams
router.get('/get/all', auth.required, async (req, res, next) => {
  // Todo pagination
  Team.find({})
    .then(teamsArr => {
      res.status(200).send({ teams: teamsArr })
    })
    .catch(next)
})

// Get any Team By Id
router.get('/get/:teamId', auth.required, async (req, res, next) => {
  const teamId = req.params.teamId
  Team.findById(teamId).populate('coach').exec()
    .then(team => {
      if (!team) return res.status(200).send(null)
      else return res.status(200).send({ team })
    })
    .catch(err => {
      if (err.kind === 'ObjectId') return res.status(200).send({ team: {} })
      else return next
    })
})

// Update Team Data
router.patch('/action/update/:teamId', auth.required, async (req, res, next) => {
  const { teamId } = req.params
  Team.findById(teamId)
    .then(team => {
      if (!team) return res.sendStatus(404)
      // Check if coach owns the team
      // else return 401
      // eslint-disable-next-line
      if (team.coach != req.payload.id) return res.status(401).send({ errors: { message: 'No permission to edit this team' } })
      team.set(req.body.team)
      team.save()
        .then(updatedTeam => {
          res.status(200).send({ team: updatedTeam })
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
