
//const lobby = require('./lobbyManager');



//var socketLobbyMap = {};

var messageHandlers = {};

function initializeWebsocketServer(server){
    server.on('connection', function connection(ws) {
        //ws.id = getUniqueID();

        ws.on('message', function incoming(message) {
            handleMessage(ws, message);
        });
  
        ws.on('close', (code, reason) => {
            //console.log(`Websocket closed [${code}]: ${reason}`);
            handleClose(ws);
        });
  
        ws.on('error', err => {
            console.error(`Websocket error: ${err}`);
            handleClose(ws);
            ws.terminate();
        });
    });
}


function handleClose(ws){
    // Clean up maps
    if(ws.userId) {// ????
        /*
        for (lobbyId in socketLobbyMap){
            //if (socketLobbyMap[lobbyId].members){
            delete socketLobbyMap[lobbyId].members[ws.id];
            lobby.removeMember(lobbyId, ws.id);
        }*/
    }
}

function registerMessageHander(type, fn){
    if (!messageHandlers[type]){
        messageHandlers[type] = [];
    }
    messageHandlers[type].push(fn)
}

function handleMessage(ws, messageString){
    // convert message to JSON
    var message = {};
    try {
        message = JSON.parse(messageString);
    } catch (err) {
        return console.error(err);
    }

    if (!message.type){
        return console.error(`Malformed websocket message: ${JSON.stringify(message, null, 4)}`);
    }
    
    console.log(message.type);

    if (messageHandlers[message.type]){
        for (handler of messageHandlers[message.type]){
            handler(ws, message.data);
        }
    }
    
    /*
    switch(message.type){
        case WS_HOST_REGISTER_MSG:
            handleHostRegisterMsg(ws, message.data);
            break; 
        case WS_MEMBER_REGISTER_MSG:
            handleMemberRegisterMsg(ws, message.data);
            break; 
        case WS_HOST_NAME_MSG:
            handleHostNameMsg(ws, message.data);
            break; 
        case WS_MEMBER_NAME_MSG:
            handleMemberNameMsg(ws, message.data);
            break; 
        case WS_HOST_ACTIVE_MSG:
            handleHostActiveMsg(ws, message.data);
            break; 
        case WS_HOST_FREEZE_MSG:
            handleHostFreezeMsg(ws, message.data);
            break;
        case WS_MEMBER_BUZZER_MSG:
            handleMemberBuzzerMsg(ws, message.data);
            break;  
        default:
            console.error(`Unexpected message type: ${message.type}`);
            break;
        
    }*/
}




function handleHostNameMsg(ws, data){
    //lobby.changeName(data.lobbyId, ws.id, data.name);
    lobby.addHost(data.lobbyId, ws.id, data.name);
    //sendMessageToLobby(data.lobbyId, WS_MEMBER_LIST_MSG, {
    //    members: lobby.getMembers(data.lobbyId),
    //    host: lobby.getHost(data.lobbyId),
    //});
    updateLobby(data.lobbyId);
}

function handleMemberNameMsg(ws, data){
    lobby.addMember(data.lobbyId, ws.id, data.name);
    updateLobby(data.lobbyId);
    //sendMessageToLobby(data.lobbyId, WS_MEMBER_LIST_MSG, {
    //    members: lobby.getMembers(data.lobbyId),
    //    host: lobby.getHost(data.lobbyId),
    //});
}





function updateLobby(lobbyId){
    sendMessageToLobby(lobbyId, WS_PAGE_UPDATE_MSG, lobby.getLobbyById(lobbyId));
}


function sendMessageToLobby(lobbyId, type, data){
    if (!socketLobbyMap[lobbyId]) return;

    // send to members
    for (id in socketLobbyMap[lobbyId].members){
            socketLobbyMap[lobbyId].members[id].send(JSON.stringify({
            type,
            data,
        }));
    }

    // send to host
    if (socketLobbyMap[lobbyId].host){
        socketLobbyMap[lobbyId].host.send(JSON.stringify({
            type,
            data,
        }));
    }
}

module.exports = {
    initializeWebsocketServer,
    registerMessageHander,
}
