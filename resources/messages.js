//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const debug = require("debug")("emulator:messages");
const express = require("express");

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;


// Create a message
router.post("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

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

    // What is the message format
    // Only text and markdown are supported for now
    const text = incoming.text;
    const markdown = incoming.markdown;
    if (!text && !markdown) {
        debug("Both text and file cannot be empty.");
        return sendError(res, 400, "Both text and file cannot be empty.");
    }

    // Where are we posting ?
    const roomId = incoming.roomId;
    const toPersonEmail = incoming.toPersonEmail;
    const toPersonId = incoming.toPersonId;
    if (roomId) {
        if (toPersonEmail || toPersonId) {
            debug("Exactly one of the destination fields must not be empty (roomId, toPersonEmail, toPersonId)");
            return sendError(res, 400, "Exactly one of the destination fields must not be empty (roomId, toPersonEmail, toPersonId)");
        }

        // Check the user is part of the room
        db.rooms.find(actor, roomId, function (err, room) {
            if (err) {
                switch (err.code) {
                    case "USER_NOT_IN_ROOM":
                    case "ROOM_NOT_FOUND":
                        debug("Could not find a room with provided ID.");
                        sendError(res, 404, "Could not find a room with provided ID.");
                        return;
                    default:
                        debug("unexpected error: " + err.message);
                        sendError(res, 500, "[EMULATOR] cannot create message, unexpected error");
                        return;
                }
            }
            // Create message
            db.messages.createInRoom(actor, room, text, markdown, null, function (err, message) {
                if (err) {
                    debug("unexpected error: " + err.message);
                    sendError(res, 500, "[EMULATOR] cannot create room, unexpected error");
                    return;
                }

                // Return payload
                // Note that Cisco Spark returns 200 OK and not a 201 CREATED here
                return sendSuccess(res, 200, message);
            });
        });

        return;
    }

    // toPersonId impl
    // toPersonEmail impl
    debug("not implemented yet");
    return sendError(res, 500, "[EMULATOR] not implemented yet");
});


// List messages
router.get("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    // Which room ?
    const roomId = req.query.roomId;
    if (!roomId) {
        debug("Required String parameter 'roomId' is not present");
        sendError(res, 400, "Required String parameter 'roomId' is not present");
        return;
    }

    // Check the user is part of the room
    db.rooms.find(actor, roomId, function (err, room) {
        if (err) {
            switch (err.code) {
                case "ROOM_NOT_FOUND":
                    debug("room not found, answering 400 as per Cisco Spark API");
                    sendError(res, 400, "Expect base64 ID or UUID.");
                    return;
                default:
                    debug(`unexpected error: ${err.message}`);
                    sendError(res, 500, "[EMULATOR] unexpected err");
                    return;
            }
        }

        // It it's a bot in a Space, pick only the messages where the bot is mentionned
        // + CHECK ?mentioned=me
        // [NOT IMPLEMENTED]
        if ((actor.type == "bot") && (room.type == "group")) {
            debug(`bot in spaces is not implemented yet`);
            sendError(res, 501, "[EMULATOR] bot in spaces is not implemented yet");
            return;
        }

        // Fetch list of messages for current room
        db.messages.listAllInRoom(actor, roomId, function (err, messages) {
            if (err) {
                debug(`Unexpected err ${err.message}`);
                sendError(res, 500, "[EMULATOR] unexpected error")
                return;
            }

            sendSuccess(res, 200, { "items" : messages });
        });
    });
});

// Get message details
router.get("/:id", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    const messageId = req.params.id;
    db.messages.find(actor, messageId, function (err, message) {
        if (err) {
            switch (err.code) {
                case "MESSAGE_NOT_FOUND":
                    debug("message ${messageId} not found.")
                    // Note that this is the message returned by Cisco Spark, time of this writing
                    return sendError(res, 404, "Unable to delete message.");
                case "ROOM_NOT_FOUND":
                case "USER_NOT_IN_ROOM":
                    debug("Could not find a room with provided ID.")
                    return sendError(res, 404, "Could not find a room with provided ID.");
                default:
                    debug(`unexpected error, cannot retrieve details for room: ${messageId}`);
                    return sendError(res, 500, "[EMULATOR] unexpected error, cannot retrieve room details");
            }
        }

        return sendSuccess(res, 200, message);
    });
});


module.exports = router;