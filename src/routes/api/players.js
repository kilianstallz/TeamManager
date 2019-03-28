const mongoose = require('mongoose')
const router = require('express').Router()
const auth = require('../auth')
const Player = mongoose.model('Player')
const Team = mongoose.model('Team')

// Create Player
router.post('/', auth.required, (req, res, next) => {
  const { body, payload: { id } } = req
  let finalPlayer = new Player(body.player)
  finalPlayer.save()
  // Directly Add Player to Team
  Team.findOne({ coach: id })
    .then(team => {
      team.players.push(finalPlayer._id)
      team.save()
        .then(update => res.send({ team: update }))
        .catch(next)
    })
    .catch(next)
})

// Get All players of my Team
router.get('/all', auth.required, (req, res, next) => {
  const { payload: { id } } = req
  console.log(req.payload)
  Team.findOne({ coach: id })
    .populate('players')
    .exec()
    .then(team => {
      res.send({ team: team.players })
    })
    .catch(next)
})

// Get single player by ID (Any Team)
router.get('/:playerId', auth.required, (req, res, next) => {
  const { playerId } = req.params
  Player.findById(playerId)
    .then(player => {
      res.send({ player })
    })
    .catch(next)
})

// Delete Single Player on my Team
router.delete('/:playerId', (req, res, next) => {
  const { playerId } = req.params

  // Find Player
  Player.findById(playerId)
    .then(player => {
      // Remove player from Team
      Team.findOne({ coach: req.payload.id })
        .then(team => {
          let arr = team.players
          let index = arr.indexOf(player._id)
          if (index > -1) {
            arr.splice(index, 1)
            team.players = arr
            team.save() // Save team
            player.remove() // Remove Player
              .then(removed => {
                res.send({ removed })
              })
              .catch(next)
          } else {
            return res.sendStatus(401)
          }
        })
        .catch(next)
    })
    .catch(next)
})

module.exports = router
