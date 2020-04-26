
const WS_HOST_REGISTER_MSG = 'host-register';
const WS_HOST_NAME_MSG = 'host-name';
const WS_MEMBER_LIST_MSG = 'member-list';
const WS_HOST_ACTIVE_MSG = 'host-active';
const WS_HOST_FREEZE_MSG = 'host-freeze';
const WS_PAGE_UPDATE_MSG = 'page-update';
const WS_REQUEST_PAGE_UPDATE_MSG = 'request-page-update';

const chooseNameModalId = 'chooseNameModal';
const chooseNameButtonId = 'chooseNameButton';
const chooseNameTextInputId = 'chooseNameTextInput';

var chartManager = new ChartManager();

let src = '/audio/buzzer.mp3';
let audio = new Audio(src);
let muted = false;

$(() => {
    var lobbyId = getLobbyId();
    if (!getCookie(lobbyId)){
        $('#'+chooseNameModalId).modal('show');
    }

    $('#'+chooseNameButtonId).click(e => {
        var name = $('#'+chooseNameTextInputId).val();

        if (name){
            setCookie(lobbyId, name, 1);
            //init(lobbyId); // init the page we are on
            $('#'+chooseNameModalId).modal('hide');

            // create a new event
            var event = new CustomEvent('name-set', {})
            document.dispatchEvent(event);
        }
    });

    $('#soundToggle').change(function() {
        muted = !$(this).prop('checked');
        console.log('muted: '+muted);
    })


    $('#'+chooseNameModalId).on('shown.bs.modal', function (e) {
        $(`#${chooseNameModalId} input[type="text"]`)[0].select();
    });

    $('#'+chooseNameModalId).on('keypress', function (event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $('#'+chooseNameButtonId).click();   
        }
    });

    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
        
        // close right panel
        setRightPanel(false);
    });


    $('#sidebarRightCollapse').on('click', function () {
        setRightPanel(true);
        //$('#sidebar-right').removeClass('active');
        //$('#sidebarRightCollapse').hide();

        // close left panel
        setLeftPanel(false);
    });

    $('#dismiss').on('click', function () {
        setRightPanel(false);
        //$('#sidebar-right').addClass('active');
        //$('#sidebarRightCollapse').show();
    });

    // Open websocket
    initWebsocket(window.location.hostname);
    //sendWsMessage(WS_HOST_REGISTER_MSG, {
    //    lobbyId: getLobbyId(),
    //    id: getCookieValue(ID_COOKIE),
    //});

    document.addEventListener(WS_PAGE_UPDATE_MSG, function(e) {
        var data = e.detail;  // the "data" from the server is here
        updatePage(data);
    });
})

function setRightPanel(visible){
    if (visible){
        $('#sidebar-right').removeClass('active');
        $('#sidebarRightCollapse').hide();
    } else {
        $('#sidebar-right').addClass('active');
        $('#sidebarRightCollapse').show();
    }
}

function setLeftPanel(visible){
    if (visible){
        $('#sidebar').removeClass('active');
        $('#sidebarCollapse').removeClass('active');
    } else {
        $('#sidebar').addClass('active');
        $('#sidebarCollapse').addClass('active');
    }
}


function updatePage(data){
    // update the lobby panel
    var hostName = data.host.userName;
    var memberNameList = [];
    for (id in data.members){
        memberNameList.push(data.members[id].userName);
    }
    updateLobby(hostName, memberNameList);
    updateChart(data.round)
}

function getLobbyId(){
    var split = window.location.href.split('/');
    return split[split.length-1].replace('#', '');
}

function getName(){
    return getCookie(getLobbyId());
}

function updateLobby(hostName, memberNameList){
    // update host
    $('#host').empty();
    $('#host').append(`
        <ul class="list-group list-group-flush">
            <li class="list-group-item list-group-item-dark">${hostName}</li>
        </ul>
    `);

    // update members
    $('#memberList').empty();
    if (memberNameList.length == 0){
        $('#memberList').append(`
            <li class="list-group-item list-group-item-dark">No members</li>
        `)
    } else {
        for (memberName of memberNameList){
            $('#memberList').append(`
                <li class="list-group-item list-group-item-dark">${memberName}</li>
            `)
        }
    }
}

function updateChart(round){
    let data = [];
    for (entry of round){
        data.push({
            key: entry.name,
            value: entry.delta,
        });
    }
    chartManager.plot(data);
}

function ChartManager(){
    // Roster of colors to color charts with
    this.COLORS = [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 205, 86)',
        'rgb(201, 203, 207)'
    ]
    this.ALPHA = 0.5,
    this.colorCounter = 0,
    this.getColor = function(){
        return this.COLORS[this.colorCounter++ % this.COLORS.length];
    }

    this.transparentize = function (color){
        return Color(color).alpha(this.ALPHA).rgbString();
    }
    
    this.plot = function(data){
        let ctx = $('#resultsCanvas');

        // Build lists for displaying the bars
        let keys = [];
        let values = [];
        let backgroundColorList = [];
        let borderColorList = [];

        for (datum of data){
            let color = this.getColor();

            keys.push(datum.key);
            values.push(datum.value);
            backgroundColorList.push(color);
            borderColorList.push(this.transparentize(color));
        }

        // build the actual chart
        let chart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: keys,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColorList,
                    borderColor: borderColorList,
                    borderWidth: 1,
                    minBarLength: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                        display: true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Buzz Time (ms)',
                        },
                        ticks: {
                            beginAtZero: true,
                        },
                    }],
                },
            },
        });
    }
}


function playBuzzerNoise(){
    if (!muted){
        audio.play();
    }
}