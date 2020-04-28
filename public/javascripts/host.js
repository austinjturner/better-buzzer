
var pageCache = {};

$( document ).ready(() => {
    $('#toggle').bootstrapToggle({
        on: 'Active',
        off: 'Frozen',
        size: 'large',
    });
    $('#toggle').bootstrapToggle('off');

    $('#toggle').change(function() {
        if ($('#toggle').prop('checked')){
            sendWsMessage(WS_HOST_ACTIVE_MSG, {lobbyId: getLobbyId()});
        } else {
            sendWsMessage(WS_HOST_FREEZE_MSG, {lobbyId: getLobbyId()});
        }
    })

    $("#nameText").change(function(){
        sendWsMessage(WS_HOST_NAME_MSG, {
            lobbyId: getLobbyId(),
            name: $('#nameText').val()
        });
    });

    // update link text for this page
    $('#linkText').val(window.location.origin + $('#linkText').val());
    

    $("#copyBtn").off("click");
    $('#copyBtn').click(e => {
        $('#linkText').select();
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
    });

    $('#resetButton').click(e => {
        // simulate reset by flipping button twice
        let active = $('#toggle').prop('checked');
        if (active) sendWsMessage(WS_HOST_FREEZE_MSG, {lobbyId: getLobbyId()});
        sendWsMessage(WS_HOST_ACTIVE_MSG, {lobbyId: getLobbyId()});
        if (!active) sendWsMessage(WS_HOST_FREEZE_MSG, {lobbyId: getLobbyId()});
    });

    document.addEventListener(WS_PAGE_UPDATE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        updateHostPage(data);
    });

    init();
})


function init(){
    var lobbyId = getLobbyId();

    if (!getCookie(lobbyId)){
        document.addEventListener('name-set', function(e) {
            init();
        });
        return;
    }
    sendWsMessage(WS_HOST_REGISTER_MSG, {
        userId: getCookieValue(ID_COOKIE),
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

    pageCache = data;
}