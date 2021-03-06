
const ID_COOKIE = 'buzzerId';

var socket;

// TODO remove param
function initWebsocket(){
    if (socket) {
        console.error(`Trying to reopen websocket`);
        return;
    }

    // Determine whether to use SSL or not
    const protocol = location.protocol == 'http:' ? 'ws://' : 'wss://';

    const hostname = window.location.hostname;
    const socketURL = `${protocol}${hostname}:${location.port}`

    socket = new WebSocket(socketURL);
    socket.onopen = e => {

    }

    socket.onmessage = event => {
        var message = {};
        try {
            message = JSON.parse(event.data);
        } catch (err) {
            return console.error(err);
        }
        
        var event = new CustomEvent(message.type, {'detail': message.data})
        document.dispatchEvent(event); 
    }

    socket.onclose = event => {
        console.log(event);

        // remove socket to allow reconnection
        socket = null;
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
        setTimeout(function() {
            initWebsocket();
        }, 1000);
    }

    socket.onerror = err => {
        console.error(err);
    }
    
}

function sendWsMessage(type, data){
    var messageWaitTime = socket.readyState == WebSocket.CONNECTING ? 500 : 0;
    setTimeout(()=>{
        socket.send(JSON.stringify({type, data}));
    }, messageWaitTime)
}
