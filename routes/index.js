/*
 * Router to handle all html/pug pages
 */

var express = require('express');
var lobby = require('../utils/lobbyManager');
var router = express.Router();

const title = 'Better Buzzer';

/* Middleware to check for lobbyId not found */
function checkLobbyId(req, res, next){
  var lobbyId = req.params.lobbyId;
  if (lobbyId && !lobby.lobbyIdExists(lobbyId)) {
    res.render('404', { 
      title,
      message: 'Lobby Not Found',
    });
  } else {
    next();
  }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title });
});

/* GET host redirect page. */
router.get('/host', function(req, res, next) {
  var newLobby = lobby.createLobby();
  res.redirect('/host/'+newLobby.lobbyId);
});

/* GET host page */
router.get('/host/:lobbyId', checkLobbyId, function(req, res, next) {
  res.render('host', { 
    title,
    lobbyId: req.params.lobbyId,
  });
});

/* GET lobby page. */
router.get('/lobby/:lobbyId', checkLobbyId, function(req, res, next) {
  res.render('lobby', { 
    title,
    lobby: lobby.getLobbyById(req.params.lobbyId),
  });
});

//The 404 Route
router.get('*', function(req, res){
  res.render('404', { 
    title,
    message: 'Route Not Found',
  });
});

module.exports = router;
