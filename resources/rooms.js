//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const debug = require("debug")("emulator:rooms");
const express = require("express");

// default routing properties to mimic
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;


// Create a room
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
    const title = incoming.title;
    if (!title || (typeof title != "string")) {
        debug("Title cannot be empty.");
        return sendError(res, 400, "Title cannot be empty.");
    }

    // Default values
    const type = incoming.type ? incoming.type : "group";
    if ((type !== "direct") && (type !== "group")) {
        debug(`Can not construct instance of HydraRoomType from String value '${type}': value not one of declared Enum instance names: [direct, group] at line: 1, column: 2`);
        return sendError(res, 400, `Can not construct instance of HydraRoomType from String value '${type}': value not one of declared Enum instance names: [direct, group] at line: 1, column: 2`);
    }

    // Create room
    db.rooms.create(actor, title, type, function (err, room) {
        if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot create room, unexpected error");
            return;
        }

        // Return payload
        // Note that Webex returns 200 OK and not a 201 CREATED here
        return sendSuccess(res, 200, room);
    });
});


// List rooms
router.get("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    // Fetch list of rooms for current user
    db.rooms.list(actor, function (err, rooms) {
        if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot list rooms, unexpected error");
            return;
        }

        sendSuccess(res, 200, { "items": rooms });
    });
});


// Get room details
router.get("/:id", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    const roomId = req.params.id;
    db.rooms.find(actor, roomId, function (err, room) {
        if (err) {
            switch (err.code) {
                case "ROOM_NOT_FOUND":
                    debug("Room not found")
                    return sendError(res, 404, "Room not found");
                default:
                    debug(`unexpected error, cannot retrieve details for room: ${roomId}`);
                    return sendError(res, 500, "[EMULATOR] unexpected error, cannot retrieve room details");
            }
        }

        return sendSuccess(res, 200, room);
    });
});

// Update a room
router.put("/:id", function (req, res) {
    debug(`Update room not implemented yet`);
    return sendError(res, 501, "[EMULATOR] Update room not implemented yet");
});


// Delete a room
router.delete("/:id", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    const roomId = req.params.id;
    db.rooms.delete(actor, db.memberships, roomId, function (err, membership) {
        if (err) {
            switch (err.code) {
                case "ROOM_NOT_FOUND":
                    debug("Cannot find room to delete");
                    return sendError(res, 404, "Could not find a room with provided ID.");
                case "MEMBERSHIP_NOT_FOUND":
                case "NOT_MEMBER_OF_ROOM":
                    debug("Cannot delete room when not a member");
                    return sendError(res, 400, "Failed to delete room.");
                case "NOT_MODERATOR_OF_ROOM":
                    debug("Cannot delete moderated room when not a moderator");
                    return sendError(res, 400, "Failed to delete moderated room.");
                default:
                    debug("[EMULATOR] Unexpected error");
                    return sendError(res, 500, "[EMULATOR] Unexpected error");
            }
        }

        return sendSuccess(res, 204);
    });
});


module.exports = router;