const debug = require("debug")("emulator");
const fine = require("debug")("emulator:fine");

const express = require("express");
var bodyParser = require("body-parser");

const sendError = require("./error");

const app = express();

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });
app.use(router);

router.use(bodyParser.json()); // for parsing application/json


// Extra imports 
const uuid = require('uuid/v4');
const base64 = require('base-64');

//
// Rooms resource
//
var rooms = {};
router.post("/rooms", function (req, res) {
    // New Trackingid
    res.context = { "uuid": "EM_" + uuid() };

    // Check authentication
    const auth = req.get("Authorization");
    if (!auth) {
        return sendError(res, 401);
    }

    // Check Media type
    const media = req.get("Content-Type");
    if (!media) {
        debug("no Content-Type specified");
        return sendError(res, 415, "Content type 'text/plain' not supported");
    }
    if (media !== "application/json") {
        debug(`bad 'Content-Type' specified: '${media}'`);
        return sendError(res, 415, `Content type '${media}' not supported`);
    }

    // Check incoming payload
    const incoming = req.body;
    if (!incoming) {
        return sendError(res, 400);
    }
    if (!incoming.title || (typeof incoming.title != "string")) {
        debug("missing title property in incoming payload");
        return sendError(res, 400);
    }

    // Default values
    const type = incoming.type ? incoming.type : "group";
    if ((type !== "direct") && (type !== "group")) {
        debug(`not supported room type: ${type}`);
        return sendError(res, 400);
    }

    // Create room
    const now = new Date(Date.now()).toISOString();
    var room = {
        "id": base64.encode("ciscospark://em/ROOM/" + uuid()),
        "title": incoming.title,
        "type": type,
        "isLocked": false,
        "lastActivity": now,
        "creatorId": "[TODO]",
        "created": now
    }

    // Store room
    rooms[room.id] = room;

    // Return payload
    res.status(201).send(room);
});

router.get("/rooms", function (req, res) {
    // New Trackingid
    res.context = { "uuid": "EM_" + uuid() };

    // Check authentication
    const auth = req.get("Authorization");
    if (!auth) {
        return sendError(res, 401);
    }

    // Return list of rooms ordered by lastActivity
    const list = Object.keys(rooms).map(function(key, index) {
        return rooms[key];
    }).sort(function(a, b) {
        return (a.lastActivity < b.lastActivity);
    });

    res.status(200).send(list);
});


const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log(`Emulator started on port: ${port}`);
});
