//
// This script contains the common elements to both the host and lobby pages
//

const SM_SCREEN_BREAKPOINT = 768; 
const buzzerMp3Url = '/audio/buzzer.mp3';

//
// WebSocket message types
//
const WS_HOST_REGISTER_MSG = 'host-register';
const WS_UPDATE_NAME_MSG = 'update-name';
const WS_HOST_ACTIVE_MSG = 'host-active';
const WS_HOST_FREEZE_MSG = 'host-freeze';
const WS_PAGE_UPDATE_MSG = 'page-update';
const WS_REQUEST_PAGE_UPDATE_MSG = 'request-page-update';
const WS_KICK_MEMBER_MSG = 'kick-member';

// 
// HTML id tags
// 
const hostId = 'host';
const memberListId = 'memberList';
const soundToggleId = 'soundToggle';

const chooseNameModalId = 'chooseNameModal';
const chooseNameButtonId = 'chooseNameButton';
const chooseNameTextInputId = 'chooseNameTextInput';

const sidebarLeftCollapseId = 'sidebarLeftCollapse';
const sidebarLeftCollapseButtonId = 'sidebarLeftCollapseButton';

const sidebarRightCollapseId = 'sidebarRightCollapse';
const sidebarRightCollapseButtonId = 'sidebarRightCollapseButton';
const sidebarRightCollapseDismissId = 'sidebarRightCollapseDismiss';

const sidebarBottomCollapseId = 'sidebarBottomCollapse';
const sidebarBottomCollapseButtonId = 'sidebarBottomCollapseButton';
const sidebarBottomCollapseDismissId = 'sidebarBottomCollapseDismiss';

const canvasContainerBottomId = 'canvasContainerBottom';
const resultsCanvasBottomId = 'resultsCanvasBottom';

const canvasContainerRightId = 'canvasContainerRight';
const resultsCanvasRightId = 'resultsCanvasRight';

const changeNameButtonClass = 'changeNameButton';
const kickMemberButtonClass = 'kickMemberButton';

//
// Page state variables
//
let chartManager = new ChartManager();

let audio = new Audio(buzzerMp3Url);
let muted = false;

let isScreenSM = getScreenWidth() < SM_SCREEN_BREAKPOINT;

// On load
$(() => {
    // initialize 2 charts, sized for desktop and mobile
    chartManager.init(resultsCanvasRightId);
    chartManager.init(resultsCanvasBottomId);

    // Check if we have the user's name
    // If not, open modal
    var lobbyId = getLobbyId();
    if (!getCookie(lobbyId)){
        displayChooseNameModal();
    }

    // determine whether to use chart for desktop or mobile
    if (getScreenWidth() > SM_SCREEN_BREAKPOINT){
        $('#'+sidebarBottomCollapseButtonId).hide();
    } else {
        $('#'+sidebarRightCollapseButtonId).hide();
    }

    // Open websocket
    initWebsocket();

    //
    // Resigter listeners
    //

    // Event listener to display new page data
    document.addEventListener(WS_PAGE_UPDATE_MSG, e =>  {
        var data = e.detail;  // the "data" from the server is here
        updatePage(data);
    });

    // Listen for page muted or not
    // TODO: save as cookie
    $('#'+soundToggleId).change(() =>  {
        muted = !$(this).prop('checked');
    })

    // Button listener for submit name modal button
    $('#'+chooseNameButtonId).click(e => {
        var name = $('#'+chooseNameTextInputId).val();

        if (name && name.length < 50){
            if (getCookie(lobbyId)){
                updateName(name);
            } else {
                registerName(name);
            }
            $('#'+chooseNameModalId).modal('hide');
        }
    });

    // Select text input automatically on modal open
    $('#'+chooseNameModalId).on('shown.bs.modal', e =>  {
        $(`#${chooseNameModalId} input[type="text"]`)[0].select();
    });

    // Click the submit button automatically on enter key
    $('#'+chooseNameModalId).on('keypress', e =>  {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            $('#'+chooseNameButtonId).click();   
        }
    });

    // listen for clicks on left panel button
    $('#'+sidebarLeftCollapseButtonId).on('click', () =>  {
        $('#'+sidebarLeftCollapseId).toggleClass('active');
        $(this).toggleClass('active');
        
        // close chart panels
        setRightPanel(false);
        setBottomPanel(false);
    });

    // listen for clicks on right panel button
    $('#'+sidebarRightCollapseButtonId).on('click', () =>  {
        // open right panel
        setRightPanel(true);

        // close left panel
        setLeftPanel(false);
    });
    
    // listen for clicks on dismiss bottom panel button
    $('#'+sidebarBottomCollapseButtonId).click(() => {
        setLeftPanel(false);
    });

    // listen for clicks on dismiss right panel button
    $('#'+sidebarRightCollapseDismissId).on('click', () => {
        setRightPanel(false);
    });

    // listen for window resize, if they cross the breakpoint, refresh the screen
    $(window).resize(() => {
        var isScreenSMNew = getScreenWidth() < SM_SCREEN_BREAKPOINT;
        if (isScreenSMNew != isScreenSM){
            location.reload();
        }
        isScreenSM = isScreenSMNew;
    })
})

// Update page to display the latest data
function updatePage(data){
    var hostName = data.host.userName;
    var hostUserId = data.host.userId;
    var memberNameList = [];
    for (id in data.members){
        memberNameList.push({
            userId: id,
            userName: data.members[id].userName,
        });
    }

    updateLobby(hostName, hostUserId, memberNameList);
    updateChart(data.round)
}

// Update HTML to display most recent lobby members
function updateLobby(hostName, hostUserId, memberNameList){
    let userId = getCookie(ID_COOKIE);

    function wrapName(name, id){
        if (id === userId){
            name += `
                <div class="${changeNameButtonClass}" onclick="displayChooseNameModal()">
                    <i class="fas fa-edit"></i>
                </div>`;
        } else if (isHost()){
            name += `
                <div class="${kickMemberButtonClass}" onclick="kickMemberById('${id}')">
                    <i class="fas fa-user-times"></i>
                </div>`;
        }
        return name;
    }


    // update host
    $('#'+hostId).empty();
    $('#'+hostId).append(`
        <ul class="list-group list-group-flush">
            <li class="list-group-item list-group-item-dark d-flex justify-content-between">
                ${wrapName(hostName, hostUserId)}
            </li>
        </ul>
    `);

    // update members
    $('#'+memberListId).empty();
    if (memberNameList.length == 0){
        $('#'+memberListId).append(`
            <li class="list-group-item list-group-item-dark d-flex justify-content-between">No members</li>
        `)
    } else {
        for (member of memberNameList){
            $('#'+memberListId).append(`
                <li class="list-group-item list-group-item-dark d-flex justify-content-between">
                    ${wrapName(member.userName, member.userId)}
                </li>
            `)
        }
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


// Play the buzzer noise, if not muted
function playBuzzerNoise(){
    if (!muted){
        audio.play();
    }
}

// Enable or disable the right panel
function setRightPanel(visible){
    if (visible){
        $('#'+sidebarRightCollapseId).removeClass('active');
        $('#'+sidebarRightCollapseButtonId).hide();
    } else {
        $('#'+sidebarRightCollapseId).addClass('active');
        $('#'+sidebarRightCollapseButtonId).show();
    }
}

// Enable or disable the bottom panel
function setBottomPanel(visible){
    if (visible){
        $('#'+sidebarBottomCollapseId).collapse('show');
    } else {
        $('#'+sidebarBottomCollapseId).collapse('hide');
    }
}

// Enable or disable the left panel
function setLeftPanel(visible){
    // On small screens the 'active' class is reversed
    if (getScreenWidth() < SM_SCREEN_BREAKPOINT) visible = !visible;

    if (visible){
        $('#'+sidebarLeftCollapseId).removeClass('active');
        $('#'+sidebarLeftCollapseButtonId).removeClass('active');
    } else {
        $('#'+sidebarLeftCollapseId).addClass('active');
        $('#'+sidebarLeftCollapseButtonId).addClass('active');
    }
}

//
// Helper functions
//

// Determine if host
function isHost(){
    return window.location.href.includes('host');
}

// Get lobby id from URL
function getLobbyId(){
    var split = window.location.href.split('/');
    return split[split.length-1].replace('#', '');
}

// Get the users name from cookies
function getName(){
    return getCookie(getLobbyId());
}

function updateName(name){
    let lobbyId = getLobbyId();
    setCookie(lobbyId, name, 1);

    // Send message to update name
    sendWsMessage(WS_UPDATE_NAME_MSG, {
        lobbyId: lobbyId, 
        userName: name,
    });
}

function registerName(name){
    let lobbyId = getLobbyId();
    setCookie(lobbyId, name, 1);

    // create a new event
    var event = new CustomEvent('name-set', {})
    document.dispatchEvent(event);
}

function kickMemberById(id){
    sendWsMessage(WS_KICK_MEMBER_MSG, {
        lobbyId: getLobbyId(), 
        userIdToKick: id,
    });
}

function displayChooseNameModal(){
    $('#'+chooseNameTextInputId).val(getName() || '');
    $('#'+chooseNameModalId).modal('show');
}

function openRightCollapse(){
    $('#'+sidebarRightCollapseButtonId).click();
}

function openBottomCollapse(){
    if ($('#'+sidebarBottomCollapseId).is( ":hidden" )){
        $('#'+sidebarBottomCollapseButtonId).click();
    }
}

function closeRightCollapse(){
    $('#'+sidebarRightCollapseDismissId).click();
}

function openChart(){
    if (getScreenWidth() < SM_SCREEN_BREAKPOINT){
        openBottomCollapse();
    } else {
        setLeftPanel(false);
        openRightCollapse();
    }
}

function getScreenWidth(){
    return $(window).width();
}

// This class handles the creation and updating the charts/
// It relies on Chart.js
function ChartManager(){
    // a chart is stored here for each initialized chart
    this.charts = [];

    // cache to record user colors
    this.labelColorMap = {};

    // Roster of colors to color charts with
    this.COLORS = [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 205, 86)',
        'rgb(201, 203, 207)',
    ]
    this.ALPHA = 0.5,
    this.colorCounter = 0,

    this.getColor = function(){
        return this.COLORS[this.colorCounter++ % this.COLORS.length];
    }

    this.transparentize = function (color){
        return Color(color).alpha(this.ALPHA).rgbString();
    }
    
    // update the charts to display the latest data
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

    // initialize the chart
    this.init = function(canvasId){
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
                    fontSize: getScreenWidth() > SM_SCREEN_BREAKPOINT ? 36 : 14,
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
