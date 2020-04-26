
var utils = require('./utils');
var websocket = require('./websocket');

const WS_HOST_REGISTER_MSG = 'host-register';
const WS_MEMBER_REGISTER_MSG = 'member-register';
const WS_HOST_ACTIVE_MSG = 'host-active';
const WS_HOST_FREEZE_MSG = 'host-freeze';
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



// remove me
/*function changeName(id, name){
    if (lobbies[id]){
        lobbies[id].name = name;
    }    
}*/

/*function getMembers(id){
    if (!lobbies[id]){
        return [];
    } else {
        return lobbies[id].members;
    }
}

function getHost(id){
    if (!lobbies[id]){
        return [];
    } else {
        return lobbies[id].host;
    }  
}*/

function reset(id){
    if (lobbies[id]){
        lobbies[id].round = [];
    }
}

function getLobbies(){
    return lobbies;
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


function removeMember(lobbyId, memberId){
    if (lobbies[lobbyId]){
        delete lobbies[lobbyId].members[memberId];
    }
}

function recordBuzz(lobbyId, userId, delta){
    if (!lobbies[lobbyId] || !lobbies[lobbyId].members[userId]){
        return;
    }


    // TODO improve order
    lobbies[lobbyId].round.push({
        userId: userId,
        delta: delta,
    });
}

/*
function getResults(lobbyId){
    if (lobbies[lobbyId]){
        return lobbies[lobbyId].round;
    }
}*/

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