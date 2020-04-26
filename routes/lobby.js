var express = require('express');
var lobby = require ('../lobbyManager');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/:id/members', function(req, res, nect){
  res.json({members: lobby.getMembers(req.params.id)});
})

module.exports = router;
