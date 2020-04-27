
var utils = require('./utils');
var websocket = require('./websocket');

const WS_HOST_REGISTER_MSG = 'host-register';
const WS_MEMBER_REGISTER_MSG = 'member-register';
const WS_HOST_ACTIVE_MSG = 'host-active';
const WS_HOST_FREEZE_MSG = 'host-freeze';
const WS_HOST_RESET_MSG = 'host-reset';
const WS_MEMBER_BUZZER_MSG = 'member-buzzer';
const WS_PAGE_UPDATE_MSG = 'page-update';
const WS_REQUEST_PAGE_UPDATE_MSG = 'request-page-update';

var lobbies = {};

function getNumberOfLobbies(){
    return Object.keys(lobbies).length;
}

function createLobby(){
    const lobbyId = utils.getUniqueID();
    lobbies[lobbyId] = {
        lobbyId: lobbyId,
        buzzerActive: false,
        host: null,
        members: {},
        round: [],
    }

    return lobbies[lobbyId];
}

function reset(lobbyId){
    if (lobbies[lobbyId]){
        lobbies[lobbyId].round = [];
    }
}

function getLobbies(){
    return lobbies;
}

function getUserName(lobbyId, userId){
    if (lobbies[lobbyId] && lobbies[lobbyId].members[userId]){
        return lobbies[lobbyId].members[userId].userName;
    }
}

function getLobbyById(lobbyId){
    return lobbies[lobbyId];
}

function setBuzzerActive(lobbyId, buzzerActive){
    if (lobbies[lobbyId]){
        lobbies[lobbyId].buzzerActive = buzzerActive;
        if (buzzerActive){
            reset(lobbyId);
        }
    }
}

function removeMember(lobbyId, userId){
    if (lobbies[lobbyId] && lobbies[lobbyId].members){
        delete lobbies[lobbyId].members[userId];
    }
    updateLobby(lobbyId);
}

function recordBuzz(lobbyId, userId, delta){
    if (!lobbies[lobbyId] || !lobbies[lobbyId].members[userId]){
        return;
    }

    // TODO improve order
    lobbies[lobbyId].round.push({
        userId: userId,
        userName: getUserName(lobbyId, userId),
        delta: delta,
    });

    sortRound(lobbyId);
}

function sortRound(lobbyId){
    if (!lobbies[lobbyId]) return;
    var round = lobbies[lobbyId].round;

    // sort by response times first
    round.sort((a, b) => {
        return a.delta - b.delta;
    })

    // find people with the same response time, then shuffle
    var start = 0, end;
    while (start < round.length){
        var end = start;
        while(end + 1 < round.length && (round[start].delta == round[end + 1].delta)){
            end++;
        }
        shuffleSubArray(round, start, end);

        start = end + 1;
    }
}

// shuffle between array[start:end], inclusive
function shuffleSubArray(array, start, end) {
    var m = end - start + 1, t, i;

    if (m <= 1) return; // nothing to do here
  
    // While there remain elements to shuffle…
    while (m) {
  
      // Pick a remaining element…
      i = start + Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
  
    //return array;
  }

function setLobbyHost(lobbyId, userId, userName, ws){
    if (!lobbies[lobbyId]) return;

    ws.userId = userId;
    lobbies[lobbyId].host = {
        userId,
        userName,
        ws,
    }
}


function addMemberToLobby(lobbyId, userId, userName, ws){
    if (!lobbies[lobbyId]) return;
    
    if (lobbies[lobbyId].members[userId]){
        // make sure websocket is closed
    }

    ws.userId = userId;
    lobbies[lobbyId].members[userId] = {
        userId,
        userName,
        ws,
    }
}

// Do NOT copy websockets
function copyLobby(lobby){
    if (!lobby) {
        return console.error('No data');
    };

    let copy = {
        lobbyId: lobby.lobbyId,
        buzzerActive: lobby.buzzerActive,
        round: lobby.round,
        members: {},
    };

    if (lobby.host){
        copy.host = {
            userId: lobby.host.userId,
            userName: lobby.host.userName,
        }
    }

    for (id in lobby.members){
        copy.members[id] = {
            userId: lobby.members[id].userId,
            userName: lobby.members[id].userName,
        }
    }

    return copy;
}

function updateLobby(lobbyId){
    sendMessageToLobby(lobbyId, WS_PAGE_UPDATE_MSG, copyLobby(getLobbyById(lobbyId)));
}

function updateUser(lobbyId, ws){
    sendMessageToUser(ws, WS_PAGE_UPDATE_MSG, copyLobby(getLobbyById(lobbyId)));
}

function sendMessageToLobby(lobbyId, type, data){
    if (!lobbies[lobbyId]) return;

    // send to members
    //console.log(lobbies[lobbyId])
    for (userId in lobbies[lobbyId].members){
        sendMessageToUser(lobbies[lobbyId].members[userId].ws, type, data);
    }

    // send to host
    if (lobbies[lobbyId].host){
        sendMessageToUser(lobbies[lobbyId].host.ws, type, data);
    }
}

function sendMessageToUser(ws, type, data){
    ws.send(JSON.stringify({
        type,
        data,
    }));
}

/*
 * WebSocket message handlers
 */

function handleHostRegisterMsg(ws, data){
    let lobbyId = data.lobbyId;
    let userId = data.userId;
    let userName = data.userName;

    setLobbyHost(lobbyId, userId, userName, ws);
    updateLobby(lobbyId);
}
websocket.registerMessageHander(WS_HOST_REGISTER_MSG, handleHostRegisterMsg);

function handleMemberRegisterMsg(ws, data){
    let lobbyId = data.lobbyId;
    let userId = data.userId;
    let userName = data.userName;

    addMemberToLobby(lobbyId, userId, userName, ws);
    updateLobby(lobbyId);
}
websocket.registerMessageHander(WS_MEMBER_REGISTER_MSG, handleMemberRegisterMsg);

function handleHostActiveMsg(ws, data){
    let lobbyId = data.lobbyId;

    setBuzzerActive(lobbyId, true);
    updateLobby(lobbyId);
}
websocket.registerMessageHander(WS_HOST_ACTIVE_MSG, handleHostActiveMsg);

function handleHostFreezeMsg(ws, data){
    let lobbyId = data.lobbyId;

    setBuzzerActive(lobbyId, false);
    updateLobby(lobbyId);
}
websocket.registerMessageHander(WS_HOST_FREEZE_MSG, handleHostFreezeMsg);

function handleMemberBuzzerMsg(ws, data){
    let lobbyId = data.lobbyId;
    let delta = data.delta;
    let userId = ws.userId;

    recordBuzz(lobbyId, userId, delta);
    updateLobby(lobbyId);
}
websocket.registerMessageHander(WS_MEMBER_BUZZER_MSG, handleMemberBuzzerMsg);

function handleUpdateUser(ws, data){
    let lobbyId = data.lobbyId;

    updateUser(lobbyId, ws);
}
websocket.registerMessageHander(WS_REQUEST_PAGE_UPDATE_MSG, handleUpdateUser);

function resetBuzzerHandler(ws, data){
    let lobbyId = data.lobbyId;

    reset(lobbyId);
    updateLobby(lobbyId);
}
websocket.registerMessageHander(WS_HOST_RESET_MSG, resetBuzzerHandler);


function handleClose(ws){
    if(ws.userId) {
        // should we check the host?
        for (lobbyId in lobbies){
            removeMember(lobbyId, ws.userId);
        }
    }
}
websocket.registerCloseHandler(handleClose);

module.exports = {
    getLobbies,
    getNumberOfLobbies,
    createLobby,
    removeMember,
    reset,
    recordBuzz,
    getLobbyById,
    setBuzzerActive,
}