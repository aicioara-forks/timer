var timeout;
var interval;
var badgeInterval;

var setDate;
var pauseDate;
var alarmDate;
var runsToday = 0;

var greenColor = [76, 187, 23, 255];
var yellowColor = [250, 150, 0, 255];
var guiLagAdjustment = 500;

var alarmSound = new Audio("chime.mp3");

function setAlarm(tMillis)
{
    logStart();

    interval = tMillis;
    ringIn(tMillis + guiLagAdjustment);
}

function ringIn(tMillis)
{
    clearTimeout(timeout);
    pauseDate = null;

    var tSecs = parseInt(tMillis / 1000);
    var tMins = parseInt(tSecs / 60);
    var secs = tSecs % 60;
    var tHrs = parseInt(tMins / 60);
    var mins = tMins % 60;
    var millis = tMillis % 1000;

    alarmDate = new Date();
    // alarmDate.setTime(alarmDate.getTime() + millis);
    alarmDate.setHours(alarmDate.getHours() + tHrs);
    alarmDate.setMinutes(alarmDate.getMinutes() + mins);
    alarmDate.setSeconds(alarmDate.getSeconds() + secs);
    alarmDate.setMilliseconds(alarmDate.getMilliseconds() + millis);

    setDate = new Date();
    // timeout = setTimeout(ring, alarmDate.getTime() - setDate.getTime());
    timeout = setTimeout(ring, 1000);

    chrome.browserAction.setBadgeBackgroundColor({color:greenColor});
    chrome.browserAction.setBadgeText({text: getMinutesLeftString()});
    badgeInterval = setInterval(function() {
        chrome.browserAction.setBadgeText({text: getMinutesLeftString()});
    }, 10000);

}

function pause()
{
    pauseDate = new Date();
    clearTimeout(timeout);
    chrome.browserAction.setBadgeBackgroundColor({color:yellowColor});
}

function resume()
{
    var remainingAfterPause = (alarmDate.getTime() - pauseDate.getTime());
    ringIn(remainingAfterPause);
}

function restart()
{
    ringIn(interval + guiLagAdjustment);
}

function getTimeLeft()
{
    if (pauseDate)
        return (alarmDate.getTime() - pauseDate.getTime());

    var now = new Date();
    return (alarmDate.getTime() - now.getTime());
}

function getTimeLeftPercent()
{
    return parseInt(getTimeLeft() / interval * 100);
}

function getTimeLeftString()
{
    var until = getTimeLeft();
    var tSecs = parseInt(until / 1000);
    var tMins = parseInt(tSecs / 60);
    var tHrs = parseInt(tMins / 60);
    var secs = tSecs % 60;
    var mins = tMins % 60;
    var hrs = tHrs;
    if(mins < 10) mins = "0" + mins;
    if(hrs < 10) hrs = "0" + hrs;
    if(secs < 10) secs = "0" + secs;
    return (hrs > 0 ? hrs + ":" : "") + mins + ":" + secs;
}

function getMinutesLeftString() {
    var timeLeftString = getTimeLeftString();
    return timeLeftString.substring(0, timeLeftString.length - 3);
}

function storageGet(json) {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(json, function(result) { resolve(result); });
    });
}

function storageSet(json) {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.set(json, function() { resolve(json); });
    });
}


function addToHistory(newDate) {
    storageGet("history").then(function(oldValue) {
        if (oldValue["history"] == undefined) {
            var newArray = [];
        } else {
            newArray = oldValue["history"];
        }
        newArray.push(newDate);
        return storageSet({"history": newArray});
    }).then(function(finalResult) {
        console.log("Success");
        console.log(finalResult);
    });
}

function logStart() {
    addToHistory("STARTED - " + (new Date()).toString());
}

function logEnd() {
    addToHistory("ENDED - " + (new Date()).toString());
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size)) {s = "0" + s;}
    return s;
}

function formatDate(x) {
    return x.getFullYear() + "-" + (x.getMonth() + 1).pad(2) + "-" + (x.getDate()).pad(2) + "_" + x.getHours().pad(2) + "-" + x.getMinutes().pad(2) + "-" + x.getSeconds().pad(2);
}

function logDownload() {
    chrome.storage.local.get(null, function(items) { // null implies all items
        var result = JSON.stringify(items);
        var url = 'data:application/json;base64,' + btoa(result);
        chrome.downloads.download({
            url: url,
            filename: "intervals-" + formatDate(new Date()) + ".json"
        });
    });
}


function didCreateNotification(notificationId) {}


function ring()
{
    var notification = new Notification("Timer", {body: "Time\'s up!", icon: "img/48.png" });
    notification.onclick = function() {
        window.focus();
        this.close();
    };

    logEnd();

    runsToday++;
    if (runsToday % 5 == 0) {
        logDownload();
    }

    alarmSound.play();
    turnOff();
}

function turnOff()
{
    clearTimeout(timeout);
    clearTimeout(badgeInterval);
    interval = 0;
    alarmDate = null;
    pauseDate = null;
    setDate = null;
    chrome.browserAction.setBadgeText({text: ""});
}

function error()
{
    alert("Please enter a number between 1 and 240.");
}
