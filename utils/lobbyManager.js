/*
 * Handle the logic managing lobbies
 */

var common = require('./common');
var websocket = require('./websocketManager');

/* Define websocket message constants */
const WS_HOST_REGISTER_MSG = 'host-register';
const WS_MEMBER_REGISTER_MSG = 'member-register';
const WS_HOST_ACTIVE_MSG = 'host-active';
const WS_HOST_FREEZE_MSG = 'host-freeze';
const WS_MEMBER_BUZZER_MSG = 'member-buzzer';
const WS_PAGE_UPDATE_MSG = 'page-update';
const WS_REQUEST_PAGE_UPDATE_MSG = 'request-page-update';
const WS_UPDATE_NAME_MSG = 'update-name';

// Contains all lobbies indexed by lobbyId
// This is just held in memory, lobbies aren't meant to be persistent
var lobbies = {};

// 
function createLobby(){
    var newLobby = new Lobby();
    lobbies[newLobby.lobbyId] = newLobby;
    return newLobby;
}

function getLobbyById(lobbyId){
    return lobbies[lobbyId];
}

function lobbyIdExists(lobbyId){
    return lobbies[lobbyId] ? true : false;
}

// Constructor for lobby object
function Lobby(){
    this.lobbyId = common.getUniqueID();
    this.buzzerActive = false;
    this.host = null;
    this.members = {};
    this.round = [];

    // Build a json represention of the lobby to provide to the UI
    this.JSON = function(){
        let json = {
            lobbyId: this.lobbyId,
            buzzerActive: this.buzzerActive,
            round: this.round,
            members: {},
        };
    
        if (this.host){
            json.host = {
                userId: this.host.userId,
                userName: this.host.userName,
            }
        }
    
        for (userId in this.members){
            json.members[userId] = {
                userId: this.members[userId].userId,
                userName: this.members[userId].userName,
            }
        }
    
        return json;
    }

    // Set the host for the lobby
    this.setHost = function(userId, userName, ws){
        ws.userId = userId;
        this.host = {
            userId,
            userName,
            ws,
        }
    }

    // add a member to the lobby via their userId
    this.addMember = function(userId, userName, ws){
        if (this.members[userId]){
            // TODO: make sure websocket is closed
        }
    
        ws.userId = userId;
        this.members[userId] = {
            userId,
            userName,
            ws,
        }
    }

    // remove a member from the lobby via their userId
    this.removeMember = function(userId){
        delete this.members[userId];
    }

    // reset the round data
    this.reset = function(){
        this.round = [];
    }

    // Get a user's name from their userId
    this.getUserName = function(userId){
        return this.members[userId] ? this.members[userId].userName : null;
    }

    this.setUserName = function(userId, newUsername){
        if (this.host.userId === userId){
            this.host.userName = newUsername;
        } else {
            this.members[userId].userName = newUsername;
        }
    }

    // Enable/disable the buzzer
    this.setBuzzerActive = function(buzzerActive){
        this.buzzerActive = buzzerActive;
        if (buzzerActive){
            this.reset();
        }
    }
        
    // record the buzz timer of a single user
    this.recordBuzz = function(userId, delta){
        if (!this.members[userId]) return;
    
        this.round.push({
            userId: userId,
            userName: this.getUserName(userId),
            delta: delta,
        });
    
        this.sortRound();
    }
    
    // sort the round data
    this.sortRound = function(){
        // sort by response times first
        this.round.sort((a, b) => {
            return a.delta - b.delta;
        })
    
        // TODO: I think this is bugged, removing for now
        // find people with the same response time, then shuffle
        /*var start = 0, end;
        while (start < this.round.length){
            var end = start;
            while(end + 1 < this.round.length && (this.round[start].delta == this.round[end + 1].delta)){
                end++;
            }
            common.shuffleSubArray(this.round, start, end);
    
            start = end + 1;
        }*/
    }

    // Push a lobby update message to a single user via their userId
    this.updateUser = function(userId){
        websocket.send(this.members[userId].ws, WS_PAGE_UPDATE_MSG, this.JSON());
    }

    // Push a lobby update message to every member of the lobby
    this.updateAll = function(){
        this.broadcastMessage(WS_PAGE_UPDATE_MSG, this.JSON());
    }

    // broadcast a message to every memeber of the lobby
    this.broadcastMessage = function(type, data){
        // send to members
        for (userId in this.members){
            websocket.send(this.members[userId].ws, type, data);
        }
    
        // send to host
        if (this.host){
            websocket.send(this.host.ws, type, data);
        }
    }
}

/*
 * WebSocket message handlers
 */
function handleHostRegisterMsg(ws, data){
    let lobbyId = data.lobbyId;
    let userId = data.userId;
    let userName = data.userName;

    let lobby = getLobbyById(lobbyId);
    lobby.setHost(userId, userName, ws);
    lobby.updateAll();
}
websocket.registerMessageHander(WS_HOST_REGISTER_MSG, handleHostRegisterMsg);

function handleMemberRegisterMsg(ws, data){
    let lobbyId = data.lobbyId;
    let userId = data.userId;
    let userName = data.userName;

    let lobby = getLobbyById(lobbyId);
    lobby.addMember(userId, userName, ws);
    lobby.updateAll();
}
websocket.registerMessageHander(WS_MEMBER_REGISTER_MSG, handleMemberRegisterMsg);

function handleHostActiveMsg(ws, data){
    let lobbyId = data.lobbyId;

    let lobby = getLobbyById(lobbyId);
    lobby.setBuzzerActive(true);
    lobby.updateAll();
}
websocket.registerMessageHander(WS_HOST_ACTIVE_MSG, handleHostActiveMsg);

function handleHostFreezeMsg(ws, data){
    let lobbyId = data.lobbyId;

    let lobby = getLobbyById(lobbyId);
    lobby.setBuzzerActive(false);
    lobby.updateAll();
}
websocket.registerMessageHander(WS_HOST_FREEZE_MSG, handleHostFreezeMsg);

function handleMemberBuzzerMsg(ws, data){
    let lobbyId = data.lobbyId;
    let delta = data.delta;
    let userId = ws.userId;

    let lobby = getLobbyById(lobbyId);
    lobby.recordBuzz(userId, delta);
    lobby.updateAll();
}
websocket.registerMessageHander(WS_MEMBER_BUZZER_MSG, handleMemberBuzzerMsg);

function handleNameChange(ws, data){
    let lobbyId = data.lobbyId;
    let userName = data.userName;
    let userId = ws.userId;

    let lobby = getLobbyById(lobbyId);
    lobby.setUserName(userId, userName);
    lobby.updateAll();
}
websocket.registerMessageHander(WS_UPDATE_NAME_MSG, handleNameChange);



function handleUpdateUser(ws, data){
    let lobbyId = data.lobbyId;

    let lobby = getLobbyById(lobbyId);
    lobby.updateUser(ws.userId);
}
websocket.registerMessageHander(WS_REQUEST_PAGE_UPDATE_MSG, handleUpdateUser);

function handleClose(ws){
    if(ws.userId) {
        // should we check the host?
        for (lobbyId in lobbies){
            lobbies[lobbyId].removeMember(ws.userId);
            lobbies[lobbyId].updateAll();
        }
    }
}
websocket.registerCloseHandler(handleClose);

module.exports = {
    createLobby,
    getLobbyById,
    lobbyIdExists,
}