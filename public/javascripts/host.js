
// cache that holds a copy of the latest page data
var pageCache = {};

// 
// HTML id tags
// 
const buzzerActiveToggleId = 'buzzerActiveToggle';
const linkTextId = 'linkText';
const linkCopyButtonId = 'linkCopyButton';
const buzzerResetButtonId = 'buzzerResetButton';

// On load
$( document ).ready(() => {
    
    // update link text for this page
    $('#'+linkTextId).val(window.location.origin + $('#'+linkTextId).val());
    
    // initialize the activate button toggle
    $('#'+buzzerActiveToggleId).bootstrapToggle({
        on: 'Active',
        off: 'Frozen',
        size: 'large',
    });
    // toggle start 'off'
    $('#'+buzzerActiveToggleId).bootstrapToggle('off');

    init();
    
    //
    // Resigter listeners
    //

    // Event listener to display new page data
    document.addEventListener(WS_PAGE_UPDATE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        updateHostPage(data);
    });

    // Listener for toggle button press
    $('#'+buzzerActiveToggleId).change(function() {
        if ($('#'+buzzerActiveToggleId).prop('checked')){
            sendWsMessage(WS_HOST_ACTIVE_MSG, {lobbyId: getLobbyId()});
        } else {
            sendWsMessage(WS_HOST_FREEZE_MSG, {lobbyId: getLobbyId()});
        }
    })

    // Listener for copy link button
    $("#"+linkCopyButtonId).off("click");
    $('#'+linkCopyButtonId).click(e => {
        $('#'+linkTextId).select();
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
    });

    // Listener for reset button
    $('#'+buzzerResetButtonId).click(e => {
        // simulate reset by flipping button twice
        let active = $('#'+buzzerActiveToggleId).prop('checked');
        if (active) sendWsMessage(WS_HOST_FREEZE_MSG, {lobbyId: getLobbyId()});
        sendWsMessage(WS_HOST_ACTIVE_MSG, {lobbyId: getLobbyId()});
        if (!active) sendWsMessage(WS_HOST_FREEZE_MSG, {lobbyId: getLobbyId()});
    });

})

// Initialize host once we have the host's name
function init(){
    var lobbyId = getLobbyId();

    // If no name cookie, initialize later...
    if (!getCookie(lobbyId)){
        document.addEventListener('name-set', function(e) {
            init();
        });
        return;
    }

    // Register me via WebSocket
    sendWsMessage(WS_HOST_REGISTER_MSG, {
        userId: getCookie(ID_COOKIE),
        lobbyId: lobbyId, 
        userName: getName(),
    });
}

function updateHostPage(data){
    // detect the first buzz
    if (pageCache.round && pageCache.round.length == 0 && data.round.length > 0){
        playBuzzerNoise();
        openChart()
    }

    // update cache
    pageCache = data;
}