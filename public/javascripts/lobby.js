
const WS_MEMBER_REGISTER_MSG = 'member-register';
const WS_MEMBER_NAME_MSG = 'member-name';
const WS_MEMBER_ACTIVE_MSG = 'member-active';
const WS_MEMBER_FREEZE_MSG = 'member-freeze';
const WS_MEMBER_BUZZER_MSG = 'member-buzzer';
const WS_BUZZER_RESULTS_MSG = 'buzzer-results';

const TOO_SOON_PENALTY_MS = 1000;

var buzzerState = {
    indicator: false,
    disabled: false,
    locked: false,
    timestamp: null,
    disabled: false,
}

var pageCache = {};


$(() => {
    $("#nameText").change(function(){
        updateName();
    });

    $('#buzzer').click(()=>{
        handleBuzzerClick();
    })

    $('#button-top').on('mousedown touchstart', () => {
        if (buzzerState.locked) return;

        $('#i1').attr('hidden', true);
        $('#i2').attr('hidden', false);
        handleBuzzerClick();
    })

    $(document).on('mouseup touchend', () => {
        if (buzzerState.locked) return;

        $('#i1').attr('hidden', false);
        $('#i2').attr('hidden', true);
    })

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

function setIndicatorActive(active){
    if (active){
        $('#lightBox').addClass('box-on');
    } else {
        $('#lightBox').removeClass('box-on');
    }
}

function setBuzzerActive(active){
    if (active){
        buzzerState.timestamp = getTime();
        buzzerState.active = true;
    } else {
        buzzerState.active = false;
    }
}

function activeBuzzer(){
    buzzerState.indicator = true;
    buzzerState.disabled = false;
    buzzerState.timestamp = getTime();
    $('#lightBox').addClass('box-on');
}

function freezeBuzzer(){
    buzzerState.indicator = false;
    buzzerState.disabled = false;
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


    // Open websocket
    sendWsMessage(WS_MEMBER_REGISTER_MSG, {
        userId: getCookieValue(ID_COOKIE),
        lobbyId: lobbyId, 
        userName: getName(),
    });
}

function getTime(){
    return Date.now();
}

function handleBuzzerClick(){
    if (buzzerState.disabled){
        return;
    }

    if (buzzerState.indicator){
        playBuzzerNoise();
        buzzerState.disabled = true;

        var delta = getTime() - buzzerState.timestamp;
        sendWsMessage(WS_MEMBER_BUZZER_MSG, {
            lobbyId: getLobbyId(),
            delta: delta,
        })

        openChart();
    } else {
        // too soon penalty
        buzzerState.disabled = true;
        buzzerState.locked = true;
        
        $('#i3').attr('hidden', false);
        $('#i2').attr('hidden', false);
        $('#i1').attr('hidden', true);

        setTimeout(()=>{
            buzzerState.disabled = false;           
            buzzerState.locked = false;
            $('#i3').attr('hidden', true);
            $('#i2').attr('hidden', true);
            $('#i1').attr('hidden', false);
        }, TOO_SOON_PENALTY_MS)
    }
}

