
const ID_COOKIE = 'buzzerId';
const title = 'Better Buzzer';

var express = require('express');
var lobby = require('../lobbyManager');
var utils = require('../utils');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  setCookie(req, res);
  res.render('index', { title });
});

/* GET host page. */
router.get('/host', function(req, res, next) {
  setCookie(req, res);

  var newLobby = lobby.createLobby();
  res.redirect('/host/'+newLobby.lobbyId);
});

router.get('/host/:id', function(req, res, next) {
  res.render('host', { 
    title,
    lobbyId: req.params.id,
  });
});

/* GET join page. */
router.get('/join', function(req, res, next) {
  setCookie(req, res);

  var lobbyMap = lobby.getLobbies();
  var lobbyList = [];
  for (var key in lobbyMap){
    lobbyList.push(lobbyMap[key]);
  }

  res.render('join', { 
    title,
    lobbyList: lobbyList,
  });
});

/* GET lobby page. */
router.get('/lobby/:id', function(req, res, next) {
  setCookie(req, res);

  res.render('lobby', { 
    title,
    lobby: lobby.getLobbies()[req.params.id],
  });
});

function setCookie(req, res){
  if (!req.cookies[ID_COOKIE]){
    res.cookie(ID_COOKIE, utils.getUniqueID(), {
      maxAge: 1000 * 60 * 15000
    })
  }
}

module.exports = router;
