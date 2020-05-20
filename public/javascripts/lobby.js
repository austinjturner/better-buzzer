
//
// WebSocket message types
//
const WS_MEMBER_REGISTER_MSG = 'member-register';
const WS_MEMBER_BUZZER_MSG = 'member-buzzer';

// 
// HTML id tags
// 
const buzzerIndicatorId = 'buzzerIndicator';
const buzzerBottomId = 'buzzerBottom';
const buzzerTopId = 'buzzerTop';
const buzzerLockoutTextId = 'buzzerLockoutText';
const buzzerButtonUnpressedId = 'buzzerButtonUnpressed';
const buzzerButtonPressedId = 'buzzerButtonPressed';
const indicatorActiveClass = 'indicatorActive';
const indicatorNotActiveClass = 'indicatorNotActive';

const TOO_SOON_PENALTY_MS = 1000;

/*
 * Record the current state of the page
 * 
 *    indicator:  corresponds to the light indicating buzzer is active
 *    disabled:   used to stop buzzer input, either is locked or not active
 *    locked:     set when buzzer is pressed too early
 *    timestamp:  time when indicator was turned on
 *    disabled
 */
var buzzerState = {
    indicator: false,
    disabled: false,
    locked: false,
    timestamp: null,
}

// cache that holds a copy of the latest page data
var pageCache = {};

// On load
$(() => {
    //freezeBuzzer(); // default is frozen
    setBuzzerActive(false); // default is off
    init();

    // disable right clicks on elements of .selectDisable
    // On mobile, holding down elements turns into a "right click"
    $('.selectDisable').bind('contextmenu', function(e) {
        return false;
    }); 

    //
    // Resigter listeners
    //

    // Event listener to display new page data
    document.addEventListener(WS_PAGE_UPDATE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        updateLobbyPage(data);
    });

    // Listener for button press/touch
    $('#'+buzzerTopId).on('mousedown touchstart', () => {
        if (buzzerState.locked) return;  // Do nothing if locked out

        $('#'+buzzerButtonUnpressedId).attr('hidden', true);
        $('#'+buzzerButtonPressedId).attr('hidden', false);
        handleBuzzerClick();
    })

    // Listener for button press/touch release
    $(document).on('mouseup touchend', () => {
        if (buzzerState.locked) return;  // Do nothing if locked out

        $('#'+buzzerButtonUnpressedId).attr('hidden', false);
        $('#'+buzzerButtonPressedId).attr('hidden', true);
    })
})

// Update the page
function updateLobbyPage(data){
    // We only care if the buzzer status has changed
    if (data.buzzerActive == pageCache.buzzerActive) return;

    setBuzzerActive(data.buzzerActive);

    // save the data to compare later
    pageCache = data;
}

// Initialize lobby page once we have the member's name
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
        userId: getCookie(ID_COOKIE),
        lobbyId: lobbyId, 
        userName: getName(),
    });
}

// Logic for handling button clicks
function handleBuzzerClick(){
    // If disabled, nothing to do here...
    if (buzzerState.disabled){
        return;
    }

    if (buzzerState.indicator){
        // If indicator is on, record time, play sound, and send the message
        playBuzzerNoise();
        buzzerState.disabled = true;

        var delta = getTime() - buzzerState.timestamp;
        sendWsMessage(WS_MEMBER_BUZZER_MSG, {
            lobbyId: getLobbyId(),
            delta: delta,
        })

        // show the chart
        openChart();
    } else {
        // If indicator is off, lockout the buzzer for TOO_SOON_PENALTY_MS
        buzzerState.disabled = true;
        buzzerState.locked = true;
        
        $('#'+buzzerLockoutTextId).attr('hidden', false);
        $('#'+buzzerButtonPressedId).attr('hidden', false);
        $('#'+buzzerButtonUnpressedId).attr('hidden', true);

        setTimeout(()=>{
            buzzerState.disabled = false;           
            buzzerState.locked = false;
            $('#'+buzzerLockoutTextId).attr('hidden', true);
            $('#'+buzzerButtonPressedId).attr('hidden', true);
            $('#'+buzzerButtonUnpressedId).attr('hidden', false);
        }, TOO_SOON_PENALTY_MS)
    }
}

//
// Helper functions
//

function setIndicatorActive(active){
    if (active){
        $('#'+buzzerIndicatorId).addClass(indicatorActiveClass);
    } else {
        $('#'+buzzerIndicatorId).removeClass(indicatorActiveClass);
    }
}

function setBuzzerActive(active){
    if (active){
        buzzerState.indicator = true;
        buzzerState.disabled = false;
        buzzerState.timestamp = getTime();
        setIndicatorActive(true);
    } else {
        buzzerState.indicator = false;
        buzzerState.disabled = false;
        setIndicatorActive(false);
    }
}

function getTime(){
    return Date.now();
}

