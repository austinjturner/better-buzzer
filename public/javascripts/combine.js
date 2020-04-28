
const SM_SCREEN_BREAKPOINT = 768; 

const WS_HOST_REGISTER_MSG = 'host-register';
const WS_HOST_NAME_MSG = 'host-name';
const WS_MEMBER_LIST_MSG = 'member-list';
const WS_HOST_ACTIVE_MSG = 'host-active';
const WS_HOST_FREEZE_MSG = 'host-freeze';
const WS_HOST_RESET_MSG = 'host-reset';
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
    chartManager.init('resultsCanvas');
    chartManager.init('resultsCanvasBottom');

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
        setBottomPanel(false);
    });

    $('#sidebarRightCollapse').on('click', function () {
        setRightPanel(true);

        // close left panel
        setLeftPanel(false);
    });

    $('#collapseExampleButton').click(() => {
        setLeftPanel(false);
    });

    $('#dismiss').on('click', function () {
        setRightPanel(false);
    });

    if (screen.width > SM_SCREEN_BREAKPOINT){
        $('#collapseExampleButton').hide();
    } else {
        $('#sidebarRightCollapse').hide();
    }

    // Open websocket
    initWebsocket(window.location.hostname);

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

function setBottomPanel(visible){
    if (visible){
        $('#collapseExample').collapse('show');
    } else {
        $('#collapseExample').collapse('hide');
    }
}

function setLeftPanel(visible){
    if (screen.width < SM_SCREEN_BREAKPOINT) visible = !visible;

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

function openRightCollapse(){
    $('#sidebarRightCollapse').click();
}

function openBottomCollapse(){
    $('#collapseExampleButton').click();
}

function closeRightCollapse(){
    $('#dismiss').click();
}

function openChart(){
    if (screen.width < SM_SCREEN_BREAKPOINT){
        openBottomCollapse();
    } else {
        openRightCollapse();
    }
}

function updateChart(round){
    let data = [];
    for (entry of round){
        data.push({
            key: entry.userName,
            value: entry.delta,
        });
    }
    chartManager.plot(data);
}

function ChartManager(){
    // Roster of colors to color charts with
    this.charts = [];
    this.labelColorMap = {};
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
        for (chart of this.charts){
            // Build lists for displaying the bars
            let labels = [];
            let values = [];
            let backgroundColorList = [];
            let borderColorList = [];

            for (datum of data){
                let color = this.labelColorMap[datum.key];
                if (!color){
                    color = this.getColor();
                    this.labelColorMap[datum.key] = color;
                }

                labels.push(datum.key);
                values.push(datum.value);
                backgroundColorList.push(color);
                borderColorList.push(this.transparentize(color));
            }

            // update chart data
            chart.data.labels = labels;
            chart.data.datasets[0].data = values;
            chart.data.datasets[0].backgroundColor = backgroundColorList;
            chart.data.datasets[0].borderColor = borderColorList;

            chart.update();
        }
    }

    this.init = function(canvasId){
        // initialize the chart
        let ctx = $('#'+canvasId);
        this.charts.push(new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1,
                    minBarLength: 2,
                }]
            },                
            options: {
                responsive: true,
                maintainAspectRatio: false,
                title: {
                    display: true,
                    fontSize: screen.width > SM_SCREEN_BREAKPOINT ? 36 : 14,
                    text: 'Buzz Times',
                },
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
                tooltips: {
                    callbacks: {
                        label: (item) => `${item.xLabel} ms`,
                    },
                },
            },
        }));
    }
}

function playBuzzerNoise(){
    if (!muted){
        audio.play();
    }
}