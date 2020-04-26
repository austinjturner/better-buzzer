
$( document ).ready(() => {
    $('#toggle').bootstrapToggle({
        on: 'Active',
        off: 'Frozen',
        size: 'large',
    });
    $('#toggle').bootstrapToggle('off');

    $('#toggle').change(function() {
        if ($(this).prop('checked')){
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


    // Open websocket
    //initWebsocket(window.location.hostname);
    /*sendWsMessage(WS_HOST_REGISTER_MSG, {
        lobbyId: getLobbyId(),
        id: getCookieValue(ID_COOKIE),
    });*/

    /*document.addEventListener(WS_MEMBER_LIST_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        updateMembers(data.members);
    });*/

    init();
})
/*
function updateMembers(members){
    $('#memberList').empty();
    if (Object.keys(members).length == 0){
        $('#memberList').append(`
            <a class="list-group-item list-group-item-action" href="#">No members</a>
        `)
    } else {
        for (id in members){
            $('#memberList').append(`
                <a class="list-group-item list-group-item-action" href="#">${members[id].name}</a>
            `)
        }
    }

}*/

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
