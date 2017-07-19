
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


// Create a membership
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

    // Check room is specified
    const roomId = incoming.roomId;
    if (!roomId || (typeof roomId != "string")) {
        debug("no room specified");
        return sendError(res, 400, "roomId cannot be null");
    }

    // Check a Spark user is specified
    const personEmail = incoming.personEmail;
    const personId = incoming.personId;
    if (!personEmail && !personId) {
        debug("no person specified, neither email nor id");
        return sendError(res, 400, "Must specify either personId or personEmail.");
    }
    if (personEmail) {
        // [TODO] Retreive personId from PersonEmail
        debug("new membership with personEmail is not supported yet");
        return sendError(res, 502, "[EMULATOR] new membership with personEmail is not supported yet");
    }

    // Default values
    var isModerator = incoming.isModerator ? incoming.isModerator : false;
    if (isModerator) {
        debug("WARNING: moderation is not currently supported by the emumlator, ignoring...");
        isModerator = false;
    }

    // Create membership
    const db = req.app.locals.datastore;
    db.memberships.create(res.locals.person, roomId, personId, isModerator, function (err, membership) {
        if (!err) {
            // Return payload
            // Note that Cisco Spark returns 200 OK and not a 201 CREATED here
            return res.status(200).send(membership);
        }

        switch (err.code) {
            case "NOT_A_MEMBER":
                debug(`room not found for identifier: ${roomId}`);
                // Note that I was expecting to return a 404 or 403, but, this is the current answer from Spark
                return sendError(res, 502, "Add participant failed.");
            case "ALREADY_A_MEMBER":
                debug(`person: ${personId} is already a member of room: ${roomId}`);
                // Note that I was expecting to return a 404 or 403, but, this is the current answer from Spark
                return sendError(res, 409, "Person is already in the room.");
            case "PERSON_NOT_FOUND":
                debug(`person not found`);
                // This is the current answer from Spark
                return sendError(res, 400, "Expect base64 ID or UUID.");
            default:
                debug("could not add membership for another reason");
                // This is the current answer from Spark
                return sendError(res, 400, "[EMULATOR] could not add membership");
        }
    });
});


// List memberships
router.get("/", function (req, res) {
    const db = req.app.locals.datastore;

    // Check for room filter: memberships?roomId={{_room}}
    var roomIdFilter = req.query.roomId;
    if (roomIdFilter) {
        db.memberships.listMembershipsForRoom(res.locals.person, roomIdFilter, function (err, list) {
            if (!err) {
                return res.status(200).send({ "items": list });
            }

            switch (err.code) {
                case "NOT_MEMBER_OF_ROOM":
                    debug("Could not find a room with provided ID.");
                    return sendError(res, 404, "Could not find a room with provided ID.");
                default:
                    debug("[EMULATOR] Unexpected error");
                    return sendError(res, 500, "[EMULATOR] Unexpected error");
            }
        });
        return;
    }

    db.memberships.listUserMemberships(res.locals.person, function (err, list) {
        if (!err) {
            return res.status(200).send({ "items": list });
        }

        debug("[EMULATOR] Unexpected error");
        sendError(res, 500, "[EMULATOR] Unexpected error");
    });
});



// Get memberships details
router.get("/:id", function (req, res) {

    const membershipId = req.params.id;

    const db = req.app.locals.datastore;
    db.memberships.find(res.locals.person, membershipId, function (err, membership) {
        if (!err) {
            return res.status(200).send(membership);
        }

        switch (err.code) {
            case "MEMBERSHIP_NOT_FOUND":
            case "NOT_MEMBER_OF_ROOM":
                debug("Failed to get membership");
                return sendError(res, 404, "Failed to get membership");
            default:
                debug("[EMULATOR] Unexpected error");
                return sendError(res, 500, "[EMULATOR] Unexpected error");
        }
    });
});



module.exports = router;