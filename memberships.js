
const debug = require("debug")("emulator:memberships");
const express = require("express");

// default routing properties to mimic Cisco     Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json()); 

// Extra imports 
const uuid = require('uuid/v4');
const base64 = require('base-64');
const sendError = require('./error');

// Data store
var memberships = {};

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

    // Check room exists
    const roomId = incoming.roomId;
    if (!roomId) {
        debug("no room specified");
        return sendError(res, 400, "roomId cannot be null");
    }
    var room = db.rooms[roomId];
    if (!room) {
        debug(`room not found for identifier: ${roomId}`);
        // Note that I was expecting to return a 404 or 403, but, this is the current answer from Spark
        return sendError(res, 502, "Add participant failed.");        
    }

    // Check a valid Spark user is specified
    const personEmail = incoming.personEmail;
    const personId = incoming.personId;
    if (!personEmail && !personId)  {
        debug("no person specified, neither email nor id");
        return sendError(res, 400, "Must specify either personId or personEmail.");
    }
    if (personEmail) {
        debug("new membership with personEmail is not supported yet");
        return sendError(res, 502, "[EMULATOR] new membership with personEmail is not supported yet");        
    }
    var person = db.people[personId];
    if (!person) {
        debug(`room not found for identifier: ${roomId}`);
        // This is the current answer from Spark
        return sendError(res, 400, "Expect base64 ID or UUID.");        
    }

    // Default values
    const isModerator = incoming.isModerator ? incoming.isModerator : "false";
    if (isModerator) {
        debug("WARNING: moderation is not currently supported by the emumlator, ignoring...");
        isModerator = false;
    }

    // Create membership
    const now = new Date(Date.now()).toISOString();
    var room = {
        "id": base64.encode("ciscospark://em/ROOM/" + uuid()),
        "title": incoming.title,
        "type": type,
        "isLocked": false,
        "lastActivity": now,
        "creatorId": res.locals.person.id,
        "created": now
    }

    // Store room
    rooms[room.id] = room;

    // Return payload
    res.status(201).send(room);
});


// List rooms
router.get("/", function (req, res) {

    // Return list of memberships
    const list = Object.keys(memberships).map(function(key, index) {
        return memberships[key];
    }).sort(function(a, b) {
        return (a.roomId > b.roomId);
    });

    res.status(200).send({ "items" : list });
});


module.exports = router;