//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const debug = require("debug")("emulator");
const express = require("express");
const uuid = require('uuid/v4');


//
// Setting up common services 
//
const app = express();

// Inject EventBus
const EventEmitter = require('events').EventEmitter;
const bus = new EventEmitter();

// Inject Datastore
const datastore = require("./storage/memory");
// [TODO] replace with new MemoryDatastore(bus)
datastore.bus = bus;
app.locals.datastore = datastore;

// Inject Controller
const Controller = require("./controller");
const controller = new Controller(bus, datastore);


app.set("x-powered-by", false); // to mimic Webex headers
app.set("etag", false); // to mimic Webex headers
// Middleware to mimic Webex HTTP headers
app.use(function (req, res, next) {
    res.setHeader("Cache-Control", "no-cache"); // to mimic Webex headers

    // New Trackingid
    res.locals.trackingId = "EM_" + uuid();
    res.setHeader("Trackingid", res.locals.trackingId);

    next();
});

// Middleware to enforce authentication
const authentication = require("./auth");
app.use(authentication.middleware);

// Load initial list of accounts
const accounts = Object.keys(authentication.tokens).map(function (item, index) {
    return authentication.tokens[item];
});
datastore.people.init(accounts);


//
// Loading services
//
const peopleAPI = require("./resources/people");
app.use("/people", peopleAPI);
const roomsAPI = require("./resources/rooms");
app.use("/rooms", roomsAPI);
const membershipsAPI = require("./resources/memberships");
app.use("/memberships", membershipsAPI);
const messagesAPI = require("./resources/messages");
app.use("/messages", messagesAPI);
const webhooksAPI = require("./resources/webhooks");
app.use("/webhooks", webhooksAPI);

// Public resources
app.locals.started = new Date(Date.now()).toISOString();
var props = require('./package.json');
app.get("/", function(req, res) {
    res.status(200).send({
        "service" : "Webex REST API Emulator",
        "description" : props.description,
        "version" : 'v' + props.version,
        "up-since" : app.locals.started,
        "creator" : props.author,
        "code": "https://github.com/ObjectIsAdvantag/webex-api-emulator",
        "tokens" : "/tokens",
        "resources": [
            "/people", "/rooms", "/memberships", "/messages", "/webhooks"
        ]
    });
});
app.get("/tokens", function(req, res) {
    res.status(200).send(authentication.tokens);
});


//
// Starting server
//
const port = process.env.PORT || 3210;
app.listen(port, function () {
    debug(`Emulator started on port: ${port}`);
    console.log(`Emulator started on port: ${port}`);
});
