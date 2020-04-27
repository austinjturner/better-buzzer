
var messageHandlers = {};
var closeHandlers = [];

function initializeWebsocketServer(server){
    server.on('connection', function connection(ws) {

        ws.on('message', function incoming(message) {
            handleMessage(ws, message);
        });
  
        ws.on('close', (code, reason) => {
            for (handler of closeHandlers){
                handler(ws);
            }
        });
  
        ws.on('error', err => {
            console.error(`Websocket error: ${err}`);
            handleClose(ws);
            ws.terminate();
        });
    });
}

function registerCloseHandler(fn){
    closeHandlers.push(fn)
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

    if (messageHandlers[message.type]){
        for (handler of messageHandlers[message.type]){
            handler(ws, message.data);
        }
    }
}


module.exports = {
    initializeWebsocketServer,
    registerMessageHander,
    registerCloseHandler,
}
