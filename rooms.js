
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
    const db = req.app.locals.datastore;
    const room = db.rooms.create(res.locals.person, incoming.title, type);

    // Return payload
    res.status(201).send(room);
});


// List rooms
router.get("/", function (req, res) {

    // Fetch list of rooms for current user
    const db = req.app.locals.datastore;
    const list = db.rooms.list(res.locals.person);

    res.status(200).send({ "items": list });
});


module.exports = router;