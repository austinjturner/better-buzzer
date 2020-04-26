
const WS_MEMBER_REGISTER_MSG = 'member-register';
const WS_MEMBER_NAME_MSG = 'member-name';
const WS_MEMBER_ACTIVE_MSG = 'member-active';
const WS_MEMBER_FREEZE_MSG = 'member-freeze';
const WS_MEMBER_BUZZER_MSG = 'member-buzzer';
const WS_BUZZER_RESULTS_MSG = 'buzzer-results';

const TOO_SOON_PENALTY_MS = 500;

var buzzerState = {
    active: false,
    timestamp: null,
    disabled: false,
}

var pageCache = {};


$(() => {
    // setInterval(pingServer, pingIntervalMS)
    /*var lobbyId = getLobbyId();
    if (getCookie(lobbyId)){
        initBuzzer(lobbyId);
    } else {
        $('#'+chooseNameModalId).modal('show');
    }*/

    $("#nameText").change(function(){
        updateName();
    });

    $('#buzzer').click(()=>{
        handleBuzzerClick();
    })

    $('#button-top').mousedown(() => {
        $('#i1').attr('hidden', true);
        $('#i2').attr('hidden', false);
        playBuzzerNoise();
    })

    $(document).mouseup(() => {
        $('#i1').attr('hidden', false);
        $('#i2').attr('hidden', true);
    })


    document.addEventListener(WS_MEMBER_ACTIVE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        buzzerState.active = true;
        buzzerState.disabled = false;
        buzzerState.timestamp = getTime();
        $('#lightBox').addClass('box-on');
    });

    document.addEventListener(WS_MEMBER_FREEZE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        buzzerState.active = false;
        $('#lightBox').removeClass('box-on');
    });


    document.addEventListener(WS_PAGE_UPDATE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        updateLobbyPage(data);
    });

    freezeBuzzer(); // default is frozen
    init();
})

function updateLobbyPage(data){
    if (data.buzzerActive == pageCache.buzzerActive) return;

    if (data.buzzerActive){
        activeBuzzer();
    } else {
        freezeBuzzer();
    }

    // save the data to compare later
    pageCache = data;
}

function activeBuzzer(){
    buzzerState.active = true;
    buzzerState.disabled = false;
    buzzerState.timestamp = getTime();
    $('#lightBox').addClass('box-on');
}

function freezeBuzzer(){
    buzzerState.active = false;
    $('#lightBox').removeClass('box-on');
}

function init(){
    var lobbyId = getLobbyId();

    if (!getCookie(lobbyId)){
        document.addEventListener('name-set', function(e) {
            init();
        });
        return;
    }

    //console.log('here');

    // Open websocket
    //initWebsocket(window.location.hostname);
    sendWsMessage(WS_MEMBER_REGISTER_MSG, {
        userId: getCookieValue(ID_COOKIE),
        lobbyId: lobbyId, 
        userName: getName(),
    });
    //updateName();
}

function getTime(){
    return Date.now();
}

/*
function updateName(){
    var name = getName() || 'Anonymous';
    sendWsMessage(WS_MEMBER_NAME_MSG, {
        lobbyId: getLobbyId(),
        name: name,
    })
}*/

function handleBuzzerClick(){
    if (buzzerState.disabled){
        return;
    }

    if (buzzerState.active){
        //playBuzzerNoise();
        buzzerState.disabled = true;
        var delta = getTime() - buzzerState.timestamp;
        console.log('delta = '+delta);
        sendWsMessage(WS_MEMBER_BUZZER_MSG, {
            lobbyId: getLobbyId(),
            delta: delta,
        })
    } else {
        // too soon penalty
        $('#penalty-box').removeAttr('hidden');
        buzzerState.disabled = true;
        $('#buzzer').text('Too Early');

        setTimeout(()=>{
            buzzerState.disabled = false;
            $('#buzzer').text('');
            $('#penalty-box').attr('hidden', true);
        }, TOO_SOON_PENALTY_MS)
    }
}

