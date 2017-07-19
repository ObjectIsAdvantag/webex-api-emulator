const debug = require("debug")("emulator:memberships");
const express = require("express");

// default routing properties to mimic Cisco     Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;

//
// Create a membership
//
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

    // Check room is specified
    const roomId = incoming.roomId;
    if (!roomId || (typeof roomId != "string")) {
        debug("no room specified");
        return sendError(res, 400, "roomId cannot be null");
    }

    // Check a Spark user is specified
    const personEmail = incoming.personEmail;
    var personId = incoming.personId;
    if (!personEmail && !personId) {
        debug("no person specified, neither email nor id");
        return sendError(res, 400, "Must specify either personId or personEmail.");
    }
    // Default values
    var isModerator = incoming.isModerator ? incoming.isModerator : false;
    if (isModerator) {
        debug("WARNING: moderation is not currently supported by the emumlator, ignoring...");
        isModerator = false;
    }

    // Priority goes to the personId if specified
    // [TODO] check the priority assumption above
    if (personId) {
        // Create membership
        db.memberships.create(actor, roomId, personId, isModerator, function (err, membership) {
            if (!err) {
                // Return payload
                // Note that Cisco Spark returns 200 OK and not a 201 CREATED here
                return sendSuccess(res, 200, membership);
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

        return;
    }

    // [TODO] Retreive personId from PersonEmail
    db.people.findWithEmail(actor, personEmail, function (err, person) {
        if (err) {
            switch (err.code) {
                case "PERSON_NOT_FOUND":
                    debug(`${personEmail} not found.`);
                    return sendError(res, 404, `${personEmail} not found.`);
                default:
                    debug(`person not found with email: ${personEmail}`);
                    return sendError(res, 500, `[EMULATOR] unexpected error, person not found with email: ${personEmail}`);
            }
        }

        // Create membership
        personId = person.id;

        db.memberships.create(actor, roomId, personId, isModerator, function (err, membership) {
            if (!err) {
                // Return payload
                // Note that Cisco Spark returns 200 OK and not a 201 CREATED here
                return sendSuccess(res, 200, membership);
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
});


// List memberships
router.get("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    // Check for room filter: memberships?roomId={{_room}}
    var roomIdFilter = req.query.roomId;
    if (roomIdFilter) {
        db.memberships.listMembershipsForRoom(actor, roomIdFilter, function (err, list) {
            if (!err) {
                return sendSuccess(res, 200, { "items": list });
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

    db.memberships.listUserMemberships(actor, function (err, list) {
        if (!err) {
            return sendSuccess(res, 200, { "items": list });
        }

        debug("[EMULATOR] Unexpected error");
        sendError(res, 500, "[EMULATOR] Unexpected error");
    });
});



// Get memberships details
router.get("/:id", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    const membershipId = req.params.id;
    db.memberships.find(actor, membershipId, function (err, membership) {
        if (!err) {
            return sendSuccess(res, 200, membership);
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