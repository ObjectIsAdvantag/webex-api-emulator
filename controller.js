//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


/* 
 * Watches for actions in Webex, checks if webhooks are registered and sends notifications
 */

const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:controller");
const fine = require("debug")("emulator:controller:fine");

const request = require("request");


function Controller(bus, datastore) {

    bus.on('messages/created', function (actor, message) {
        debug(`new message: ${message.id}, in room ${message.roomId}`);
        onMessagesCreated(datastore, actor, message);
    });

    bus.on('memberships/created', function (actor, membership) {
        debug(`new membership: ${membership.id}, in room ${membership.roomId}`);
        onMembershipsCreated(datastore, actor, membership);
    });

    bus.on('memberships/deleted', function (actor, membership) {
        debug(`deleted membership: ${membership.id}, in room ${membership.roomId}`);
        onMembershipsDeleted(datastore, actor, membership);
    });
}



function onMessagesCreated(datastore, actor, message) {
    assert(datastore);
    assert(actor);
    assert(message);

    // Are there participants in the room interested by the event ?
    datastore.memberships.listMembershipsForRoom(actor, message.roomId, function (err, memberships) {
        if (err) {
            debug(`Unexpected error ${err.message}`);
            return;
        }

        // Look for webhooks to fire among room members
        var toNotify = [];
        memberships.forEach(function (membership) {
            // Find webhooks for member
            datastore.webhooks.list(membership.personId, function (err, webhooks) {
                if (err) {
                    debug(`Unexpected error ${err.message}`);
                    return;
                }

                webhooks.forEach(function (webhook) {
                    // Check if the webhook applies
                    if ((webhook.resource == "all")
                        || ((webhook.resource == "messages") && (webhook.event == "created"))) {
                        // [TODO] Check filter 
                            toNotify.push(webhook);
                    }
                });
            });
        });
        fine(`found ${toNotify.length} webhooks to fire`);

        // Fire notification
        toNotify.forEach(function (webhook) {

            // Create custom notification for registered webhook
            var notification = {
                "id": base64.encode("ciscospark://em/WEBHOOK/" + uuid()),
                "name": webhook.name,
                "targetUrl": webhook.targetUrl,
                "resource": "messages",
                "event": "created",
                "filter": webhook.filter,
                "orgId": webhook.orgId,
                "createdBy": webhook.createdBy,
                "appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MyNzljYjMwYzAyOTE4MGJiNGJkYWViYjA2MWI3OTY1Y2RhMzliNjAyOTdjODUwM2YyNjZhYmY2NmM5OTllYzFm",
                "ownedBy": webhook.ownedBy,
                "status": "active",
                "created": webhook.created,
                "actorId": actor.id,
                "data": {
                    "id": message.id,
                    "roomId": message.roomId,
                    "roomType": message.roomType,
                    "personId": message.personId,
                    "personEmail": message.personEmail,
                    "created": message.created
                }
            }

            // Fire event
            fine("firing notification to " + notification.targetUrl);
            var options = {
                method: 'POST',
                url: notification.targetUrl,
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "X-Scheduled-For": notification.created,
                    "User-Agent": "Emulator"
                },
                body: notification,
                json: true
            };

            // Signing option ?
            const secret = webhook.secret;
            if (secret) {
                options.headers["x-spark-signature"] = computeSignature(secret, notification);
            }

            request(options, function (err, response, body) {
                // Could not post to targetUrl
                if (err) {
                    debug(`could not post to: ${notification.targetUrl}, due to err: ${err.message}`);
                    return;
                }

                fine("fired notification to " + notification.targetUrl);
            });

        });
    });
}

function onMembershipsCreated(datastore, actor, membership) {
    assert(datastore);
    assert(actor);
    assert(membership);

    // Check if the new member registered for the membership webhook
    var toNotify = [];
    datastore.webhooks.list(membership.personId, function (err, webhooks) {
        if (err) {
            debug(`Unexpected error ${err.message}`);
            return;
        }

        webhooks.forEach(function (webhook) {
            // Check if the webhook applies
            if ((webhook.resource == "all")
                || ((webhook.resource == "memberships") && (webhook.event == "created"))) {
                // [TODO] Check filter
                toNotify.push(webhook);
            }
        });
    });
    fine(`found ${toNotify.length} webhooks to fire`);

    // Fire notification
    toNotify.forEach(function (webhook) {

        // Create custom notification for registered webhook
        var notification = {
            "id": base64.encode("ciscospark://em/WEBHOOK/" + uuid()),
            "name": webhook.name,
            "targetUrl": webhook.targetUrl,
            "resource": "memberships",
            "event": "created",
            "filter": webhook.filter,
            "orgId": webhook.orgId,
            "createdBy": webhook.createdBy,
            "appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MyNzljYjMwYzAyOTE4MGJiNGJkYWViYjA2MWI3OTY1Y2RhMzliNjAyOTdjODUwM2YyNjZhYmY2NmM5OTllYzFm",
            "ownedBy": webhook.ownedBy,
            "status": "active",
            "created": webhook.created,
            "actorId": actor.id,
            "data": {
                "id": membership.id,
                "roomId": membership.roomId,
                "personId": membership.personId,
                "personEmail": membership.personEmail,
                "personDisplayName": membership.personDisplayName,
                "personOrgId": membership.personOrgId,
                "isModerator": membership.isModerator,
                "isMonitor": membership.isMonitor,
                "created": membership.created
            }
        }

        // Fire event
        fine("firing notification to " + notification.targetUrl);
        var options = {
            method: 'POST',
            url: notification.targetUrl,
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "X-Scheduled-For": notification.created,
                "User-Agent": "Emulator"
            },
            body: notification,
            json: true
        };

        // Signing option ?
        const secret = webhook.secret;
        if (secret) {
            options.headers["x-spark-signature"] = computeSignature(secret, notification);
        }

        request(options, function (err, response, body) {
            // Could not post to targetUrl
            if (err) {
                debug(`could not post to: ${notification.targetUrl}, due to err: ${err.message}`);
                return;
            }

            fine("fired notification to " + notification.targetUrl);
        });

    });
}

function onMembershipsDeleted(datastore, actor, membership) {
    assert(datastore);
    assert(actor);
    assert(membership);

    // Check if the new member registered for the membership webhook
    var toNotify = [];
    datastore.webhooks.list(membership.personId, function (err, webhooks) {
        if (err) {
            debug(`Unexpected error ${err.message}`);
            return;
        }

        webhooks.forEach(function (webhook) {
            // Check if the webhook applies
            if ((webhook.resource == "all")
                || ((webhook.resource == "memberships") && (webhook.event == "deleted"))) {
                // [TODO] Check filter
                toNotify.push(webhook);
            }
        });
    });
    fine(`found ${toNotify.length} webhooks to fire`);

    // Fire notification
    toNotify.forEach(function (webhook) {

        // Create custom notification for registered webhook
        var notification = {
            "id": base64.encode("ciscospark://em/WEBHOOK/" + uuid()),
            "name": webhook.name,
            "targetUrl": webhook.targetUrl,
            "resource": "memberships",
            "event": "deleted",
            "filter": webhook.filter,
            "orgId": webhook.orgId,
            "createdBy": webhook.createdBy,
            "appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MyNzljYjMwYzAyOTE4MGJiNGJkYWViYjA2MWI3OTY1Y2RhMzliNjAyOTdjODUwM2YyNjZhYmY2NmM5OTllYzFm",
            "ownedBy": webhook.ownedBy,
            "status": "active",
            "created": webhook.created,
            "actorId": actor.id,
            "data": {
                "id": membership.id,
                "roomId": membership.roomId,
                "personId": membership.personId,
                "personEmail": membership.personEmail,
                "personDisplayName": membership.personDisplayName,
                "personOrgId": membership.personOrgId,
                "isModerator": membership.isModerator,
                "isMonitor": membership.isMonitor,
                "created": membership.created
            }
        }
        // Fire event
        fine("firing notification to " + notification.targetUrl);
        var options = {
            method: 'POST',
            url: notification.targetUrl,
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "X-Scheduled-For": notification.created,
                "User-Agent": "Emulator"
            },
            body: notification,
            json: true
        };

        // Signing option ?
        const secret = webhook.secret;
        if (secret) {
            options.headers["x-spark-signature"] = computeSignature(secret, notification);
        }

        request(options, function (err, response, body) {
            // Could not post to targetUrl
            if (err) {
                debug(`could not post to: ${notification.targetUrl}, due to err: ${err.message}`);
                return;
            }

            fine("fired notification to " + notification.targetUrl);
        });

    });
}

const crypto = require("crypto");
function computeSignature(secret, notification) {
    return crypto.createHmac('sha1', secret).update(JSON.stringify(notification)).digest('hex');
}



module.exports = Controller;
