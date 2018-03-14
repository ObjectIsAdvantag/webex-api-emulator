//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const debug = require("debug")("emulator:webhooks");
const express = require("express");

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;


// Create a webhook
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
    const name = incoming.name;
    if (!name || (typeof name != "string")) {
        debug("name cannot be empty");
        return sendError(res, 400, "name cannot be empty");
    } 
    const targetUrl = incoming.targetUrl;
    if (!targetUrl || (typeof targetUrl != "string")) {
        debug("targetUrl cannot be null");
        return sendError(res, 400, "targetUrl cannot be null");
    }

    // Default values
    const resource = incoming.resource ? incoming.resource : "all";
    const event = incoming.event ? incoming.event : "all";
    const filter = incoming.filter ? incoming.filter : null;
    const secret = incoming.secret ? incoming.secret : null;

    // Create webhook
    db.webhooks.create(actor, name, resource, event, targetUrl, filter, secret, function (err, webhook) {
        if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot create webhook, unexpected error");
            return;
        }

        // Return payload
        // Note that Cisco Spark returns 200 OK and not a 201 CREATED here
        return sendSuccess(res, 200, webhook);
    });
});


// List webhooks
router.get("/", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    // Fetch list of rooms for current user
    db.webhooks.list(actor.id, function (err, webhooks) {
        if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot list webhooks, unexpected error");
            return;
        }

        sendSuccess(res, 200, { "items": webhooks });
    });
});


// Get webhook details
router.get("/:id", function (req, res) {
    debug("Not implemented");
    return sendError(res, 501, "[EMULATOR] Not implemented");
});

// Delete a webhook
router.delete("/:id", function (req, res) {
    const db = req.app.locals.datastore;
    const actor = res.locals.person;

    const webhookId = req.params.id;
    db.webhooks.delete(actor, webhookId, function (err) {
        if (err) {
            switch (err.code) {
                case "WEBHOOK_NOT_FOUND":
                    debug("Cannot find webhook to delete");
                    return sendError(res, 400, "Invalid webhookId for Delete Webhook request.");
                case "NOT_OWNER_OF_WEBHOOK":
                    debug("Cannot delete webhook not owned by user");
                    return sendError(res, 400, "Failed to delete webhook.  You are not the owner of it.");
                default:
                    debug("[EMULATOR] Unexpected error");
                    return sendError(res, 500, "[EMULATOR] Unexpected error");
            }
        }
        return sendSuccess(res, 204);
    });
});


module.exports = router;