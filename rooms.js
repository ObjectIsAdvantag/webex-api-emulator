
const debug = require("debug")("emulator:rooms");
const express = require("express");

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json()); 

// Extra imports 
const uuid = require('uuid/v4');
const base64 = require('base-64');
const sendError = require('./error');

// Data store
var rooms = {};

// Create a room
router.post("/", function (req, res) {

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


// List rooms
router.get("/", function (req, res) {

    // Return list of rooms ordered by lastActivity
    const list = Object.keys(rooms).map(function(key, index) {
        return rooms[key];
    }).sort(function(a, b) {
        return (a.lastActivity < b.lastActivity);
    });

    res.status(200).send({ "items" : list });
});

module.exports = router;