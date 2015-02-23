"use strict";
/*
 * This class will act as a client to TFC.
 * Commands will be processed in queue.
 * Acknowledgements are ignore at this time.
 * Notification as an when received will trigger the callbacks registered against each type.
 * GAUSA
 * TODO: Multiple clients needs to be tested.
 * TODO: Need to change the cmd result to "as-is" json, extra processing ideally be done in callbacks.
 * TODO: Need to change notification callback logic to ensure removal of correct callback if any client unsubscribe
 * TODO: Release test harness cngClient-spec.js (jasmine) also find a way to integrate/maintain.
 */

var clientSock = require('net').Socket();
var xml2js = require('xml2js');

var parseString = xml2js.parseString;
var builder = new xml2js.Builder({'rootName': "Barco", 'headless': true});

var HOST = "localhost"; //default
var PORT = "5010";
var USERNAME = "BARCO";
var PASSWORD = "BARCO";
var cmdQueue = [];

//A map of callbacks to be invoked on notification received
var notificationCallbackMap = {
    layoutsChanged: [],
    activeLayoutChanged: [],
    sourcesChanged: [],
    sourceAudioChanged: [],
    previewThumbnailChanged: [],
    layoutRuntimeDataChanged: [],
    selectedCompositionChanged: [],
    displayPowerStateChanged: []
};
var lastCommand;
var lastCallback;
var buffer = "";
var isQEmpty = false;

function executeCommand(cmdObj) {
    var commandStr = builder.buildObject(cmdObj);
    console.log("3) EXECUTING COMMAND-> " + commandStr);
    clientSock.write(commandStr);
}

function processQueue() {
    if (cmdQueue.length > 0) {
        var queueObj = cmdQueue.shift();
        console.log("2) PROCESS QUEUE FOR COMMAND>>>>>" + queueObj.cmdObj.Action.$.command);
        lastCommand = queueObj.cmdObj.Action.$.command;
        lastCallback = queueObj.callback;
        executeCommand(queueObj.cmdObj);
    } else {
        //Q was found empty nothing to process
        isQEmpty = true;
    }
}

function addCmdToQueue(cmdObj, callback) {
    var queueObj = {};
    queueObj.cmdObj = cmdObj;
    queueObj.callback = callback;
    cmdQueue.push(queueObj);
    console.log("1) Added cmd to queue and the q length now is: " + cmdQueue.length);
    if (isQEmpty) {
        // Q was empty, need to start processing again.
        processQueue();
        isQEmpty = false;
    }
}

var client = {
    authenticate: function (username, password) {
        var authObj = {Action: {$: {'command': "authenticate"}}};
        authObj.Action.$.clientUserName = username;
        authObj.Action.$.clientPassword = password;
        executeCommand(authObj);
        lastCommand = authObj.Action.$.command;
    },

    connect: function () {
        clientSock.connect(PORT, HOST, function () {
            console.log("Connected to TFC");
            client.authenticate(USERNAME, PASSWORD);
        });
    },

    disconnect: function () {
        clientSock.end();
    },

    subscribeForNotification: function (subEvent, callback) {
        var cmdObj = {Action: {$: {'command': "subscribe"}}};
        cmdObj.Action.$.notificationType = subEvent;
        notificationCallbackMap[subEvent].push(callback);
        addCmdToQueue(cmdObj);
    },

    getCompositions: function (callback) {
        var cmdObj = {Action: {$: {'command': "getCompositions"}}};
        addCmdToQueue(cmdObj, callback);
    },

    getActiveLayout: function (callback, compositorId) {
        var cmdObj = {Action: {$: {'command': "getActiveLayout"}}};
        cmdObj.Action.$.compositorId = compositorId;
        addCmdToQueue(cmdObj, callback);
    },

    getLayoutRuntimeData: function (compositorId, title, callback) {
        var cmdObj = {Action: {$: {'command': "getLayoutRuntimeData"}}};
        cmdObj.Action.$.compositorId = compositorId;
        cmdObj.Action.$.title = title;
        addCmdToQueue(cmdObj, callback);
    },

    getLayoutsRuntimeData: function (compositorId, callback) {
        var cmdObj = {Action: {$: {'command': "getLayoutRuntimeData"}}};
        cmdObj.Action.$.compositorId = compositorId;
        addCmdToQueue(cmdObj, callback);
    },

    getCustomLayouts: function (compositorId, callback) {
        var cmdObj = {Action: {$: {'command': "getCustomLayoutData"}}};
        cmdObj.Action.$.compositorId = compositorId;
        addCmdToQueue(cmdObj, callback);
    },

    getSources: function (compositorId, callback) {
        var cmdObj = {Action: {$: {'command': "getSources"}}};
        cmdObj.Action.$.compositorId = compositorId;
        addCmdToQueue(cmdObj, callback);
    },

    showSource: function (deviceId, channelId, compositorId, showFullScreen, callback) {
        var cmdObj = {Action: {$: {'command': "showSource"}}};
        cmdObj.Action.$.deviceId = deviceId;
        cmdObj.Action.$.channelId = channelId;
        cmdObj.Action.$.compositorId = compositorId;
        cmdObj.Action.$.showFullscreen = showFullScreen;
        addCmdToQueue(cmdObj, callback);
    },

    hideSource: function (deviceId, channelId, compositorId, showFullScreen, callback) {
        var cmdObj = {Action: {$: {'command': "hideSource"}}};
        cmdObj.Action.$.deviceId = deviceId;
        cmdObj.Action.$.channelId = channelId;
        cmdObj.Action.$.compositorId = compositorId;
        cmdObj.Action.$.showFullscreen = showFullScreen;
        addCmdToQueue(cmdObj, callback);
    },

    activateLayout: function (compositorId, layoutTitle, callback) {
        var cmdObj = {Action: {$: {'command': "activateLayout"}}};
        cmdObj.Action.$.compositorId = compositorId;
        cmdObj.Action.$.title = layoutTitle;
        addCmdToQueue(cmdObj, callback);
    },

    getSourceThumbnail: function (deviceId, channelId, callback) {
        var cmdObj = {Action: {$: {'command': "getSourceThumbnail"}}};
        cmdObj.Action.$.deviceId = deviceId;
        cmdObj.Action.$.channelId = channelId;
        addCmdToQueue(cmdObj, callback);
    },

    setSourceVolume: function (deviceId, channelId, value, callback) {
        var cmdObj = {Action: {$: {'command': 'setVolumePercentageForSource'}}};
        cmdObj.Action.$.deviceId = deviceId;
        cmdObj.Action.$.channelId = channelId;
        cmdObj.Action.$.value = value;
        addCmdToQueue(cmdObj, callback);
    },

    addLayout: function (layout, callback) {
        var cmdObj = {Action: {$: {'command': 'addLayout'}}};
        cmdObj.Action.Layout = layout;
        addCmdToQueue(cmdObj, callback);
    },

    addSource: function(signalType,title,deviceId,channelId,url,addToConfiguration,extraTags,audioEnabled, callback){
        var cmdObj = {Action: {$: {'command': 'addSource'}}};
        cmdObj.Action.$.signalType = signalType;
        cmdObj.Action.$.title=title;
        cmdObj.Action.$.deviceId=deviceId;
        cmdObj.Action.$.channelId=channelId;
        cmdObj.Action.$.url=url;
        cmdObj.Action.$.addToConfiguration=addToConfiguration;
        cmdObj.Action.$.extraTags=extraTags;
        cmdObj.Action.$.audioEnabled=audioEnabled;
        addCmdToQueue(cmdObj,callback);
    }
};

exports.client = client;

function processNotificationData(data) {
    var json = {};
    var action = data.Notify[0].Action[0];
    var result = data.Notify[0].Result[0];
    var notificationType = action.$.notificationType;
    var compositorId;
    if (action.$.compositorId) {
        compositorId = action.$.compositorId;
    }
    switch (notificationType) {
        case 'previewThumbnailChanged' :
            var deviceId = action.$.deviceId;
            var img = result.Image[0].$.previewData;
            json.image = [];
            json.image.push({
                "deviceId": deviceId,
                "src": img
            });
            break;
        case 'activeLayoutChanged' :

            var title = action.$.title;
            var layoutId = action.$.layoutId;
            json.layout = [];
            json.layout.push({
                "compositorId": compositorId,
                "title": title,
                "layoutId": layoutId,
                "activeLayout": action.$.activeLayout
            });
            break;
        case 'sourcesChanged' :
            compositorId = action.$.compositorId;
            json.compositorId = compositorId;
            break;
        case 'layoutsChanged' :
            compositorId = action.$.compositorId;
            json.compositorId = compositorId;
            break;
    }
    var callbackArr = notificationCallbackMap[action.$.notificationType];
    if (callbackArr.length !== 0) {
        for (var i = 0; i < callbackArr.length; i += 1) {
            var notificationCallbackFn = callbackArr[i];
            if (typeof notificationCallbackFn === 'function') {
                notificationCallbackFn(json);
            }
        }
    }
}

var insertions = [];
function collectChildInsertions(insertion) {

    var inserts = insertion.Insertion;
    if (inserts) {
        for (var j = 0; j < inserts.length; j += 1) {
            insertions.push(inserts[j]);
            collectChildInsertions(inserts[j]);
        }
    }
    if (insertion.Region) {
        var regions = insertion.Region;
        for (var k = 0; k < regions.length; k += 1) {
            collectChildInsertions(regions[k]);
        }
    } else {
        return;
    }
}

function processCommandResponse(data) {
    var json = {};
    var action = data.Notify[0].Action[0];
    var result = data.Notify[0].Result[0];

    var cmdStr = action.$.command;
    if (cmdStr === "getCompositions") {
        json.composition = [];
        var composition = result.Compositions[0].Composition[0];
        var id = composition.$.compositorId;
        var title = composition.$.title;
        json.composition.push({
            "compositorId": id,
            "title": title
        });
    }
    else if (cmdStr === "getActiveLayout") {
        if (result.Layout) {
            var layout = result.Layout[0];
            var compositorId = action.$.compositorId;
            json.layout = [];
            json.layout.push({
                "layoutId": layout.$.layoutId,
                "title": layout.$.title,
                "compositorId": compositorId
            });
        }
    }
    else if (cmdStr === "getLayoutRuntimeData") {
        if (result.Layouts[0]) {
            var layouts = result.Layouts[0].Layout;
            json.layouts = [];
            for (var i = 0; i < layouts.length; i += 1) {
                var layoutTitle = layouts[i].$.title;
                var layoutId = layouts[i].$.layoutId;
                var parentInsertion = layouts[i].Insertion[0];

                var parent = [];
                parent.push({
                    "x": parentInsertion.$.x,
                    "y": parentInsertion.$.y,
                    "width": parentInsertion.$.width,
                    "height": parentInsertion.$.height,
                    "absoluteX": parentInsertion.$.absoluteX,
                    "absoluteY": parentInsertion.$.absoluteY,
                    "absoluteWidth": parentInsertion.$.absoluteWidth,
                    "absoluteHeight": parentInsertion.$.absoluteHeight
                });

                var childList = [];
                collectChildInsertions(parentInsertion);

                for (var j = 0; j < insertions.length; j += 1) {
                    childList.push({
                        "deviceId": insertions[j].SourceRef[0].$.deviceId,
                        "x": insertions[j].$.x,
                        "y": insertions[j].$.y,
                        "width": insertions[j].$.width,
                        "height": insertions[j].$.height,
                        "absoluteX": insertions[j].$.absoluteX,
                        "absoluteY": insertions[j].$.absoluteY,
                        "absoluteWidth": insertions[j].$.absoluteWidth,
                        "absoluteHeight": insertions[j].$.absoluteHeight
                    });

                }
                insertions = [];

                json.layouts.push({
                    "layoutTitle": layoutTitle,
                    "layoutId": layoutId,
                    "parent": parent,
                    "child": childList
                });
            }
        }
    }
    else if (cmdStr === "getSources") {
        var sources = result.Sources[0].Source;
        json.source = [];
        for (var k = 0; k < sources.length; k += 1) {
            json.source.push({
                "url": sources[k].$.url,
                "title": sources[k].$.title,
                "deviceId": sources[k].$.deviceId,
                "channelId": sources[k].$.channelId,
                "onScreen": sources[k].$.onScreen,
                "hasAudio": sources[k].$.hasAudio,
                "audioVolume": sources[k].$.audioVolume
            });
        }
    }
    else if (cmdStr === "getSourceThumbnail") {
        var image = result.Image[0];
        var deviceId = action.$.deviceId;
        json.image = [];
        var src = image.$.src;
        json.image.push({
            "src": src,
            "deviceId": deviceId
        });
    }
    else if (cmdStr === "showSource") {
        json.executed = result.$.actionExecuted;
    }
    else if (cmdStr === "hideSource") {
        json.executed = result.$.actionExecuted;
    }
    else if (cmdStr === "getCustomLayoutData"){
        json = result.Layouts[0].Layout;
    }
    else if (cmdStr === "addLayout"){
        json = result;
    }
    else if (cmdStr === "addSource"){
        json = result;
    }
    //Invoke callback
    if (lastCallback) {
        lastCallback(json);
    } else {
        console.log("CALLBACK NOT DEFINED YET");
    }
}

clientSock.on('error', function (e) {
    console.log('Error connecting to TFC : ', e.code, ' trying again ...');
});

clientSock.on('end', function (data) {
    console.log("This socket is ended " + data);
});

clientSock.on('data', function (data) {
    var str = data.toString();
    console.log("4) Data Received on Socket"+ data);
    buffer = buffer + str;
    if (str.indexOf("</Barco>") !== -1) {
        buffer = "<Root>" + buffer + "</Root>";
        parseString(buffer, function (err, received) {
            for (var i = 0; i < received.Root.Barco.length; i += 1) {
                var data = received.Root.Barco[i];
                if (data.Acknowledge) {
                    console.log("5) Received acknowledgement for command : " + lastCommand);
                }
                else if (data.Notify) {
                    if (data.Notify[0].$.commandNumber === "-1") {
                        console.log("5) Received Result for a notification");
                        processNotificationData(data);
                    }
                    else {
                        console.log("5) Received Result for a command : " + data.Notify[0].Action[0].$.command);
                        processCommandResponse(data);
                        //Send next command to server
                        processQueue();
                    }
                }
            }
        });
        //this buffer is used, reset buffer for next use
        buffer = "";
    }
});