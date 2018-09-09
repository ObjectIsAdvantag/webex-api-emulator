//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:webhooks");


function WebhookStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
}

WebhookStorage.prototype.create = function (actor, name, resource, event, targetUrl, filter, secret, cb) {

    assert.ok(actor);
    assert.ok(name);
    // [TODO] check resource consistency
    assert.ok(resource);
    // [TODO] check event consistency
    assert.ok(event);
    // [TODO] check targetURL consistency
    assert.ok(targetUrl);
    // [TODO] if filter, check consistency

    // Create webhook
    const now = new Date(Date.now()).toISOString();
    var webhook = {
        "id": base64.encode("ciscospark://em/ROOM/" + uuid()),
        "name": name,
        "targetUrl": targetUrl,
        "resource": resource,
        "event": event,
        "filter": filter,
        "secret": secret,
        "orgId": actor.orgId,
        "createdBy": actor.id,
        "appId": "Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OL0MyNzljYjMwYzAyOTE4MGJiNGJkYWViYjA2MWI3OTY1Y2RhMzliNjAyOTdjODUwM2YyNjZhYmY2NmM5OTllYzFm",
        "ownedBy": "creator",
        "status": "active",
        "created": now
    }

    // Store webhook
    this.data[webhook.id] = webhook;

    if (cb) {
        cb(null, webhook);
    }
}


// Returns the webhook of the specified actor
WebhookStorage.prototype.list = function (actorId, cb) {

    assert.ok(actorId);

    // List webhooks for actor, order by created date DESC
    const self = this;
    var webhooks = [];
    Object.keys(this.data).forEach(function (key) {
        let webhook = self.data[key];
        if (webhook.createdBy == actorId) {
            webhooks.push(webhook);
        }
    });

    webhooks.sort(function (a, b) {
        return (a.created < b.created);
    });

    if (cb) {
        return cb(null, webhooks);
    }
}

// Deletes a webook
WebhookStorage.prototype.delete = function (actor, webhookId, cb) {

    assert.ok(actor);
    assert.ok(webhookId);

    // Check room exists
    const webhook = this.data[webhookId];
    if (!webhook) {
        debug(`webhook does not exists with id: ${webhookId}`);
        if (cb) {
            var err = new Error(`webhook does not exists with id: ${webhookId}`);
            err.code = "WEBHOOK_NOT_FOUND";
            return cb(err, null);
        }
    }

    // Check if the user owns this webhook
    if (webhook.createdBy != actor.id) {
        debug(`webhook does not exists with id: ${webhookId}`);
        if (cb) {
            var err = new Error(`webhook with id: ${webhookId} is not owned by user: ${actor.id}`);
            err.code = "NOT_OWNER_OF_WEBHOOK";
            return cb(err, null);
        }
    }
    // If we made it here delete the room itself
    delete (this.data[webhookId]);

    // GOOD TO KNOW: Webex does not seem to generate an event for deleted webhook

    if (cb) {
        cb(null, null);
    }
}
module.exports = WebhookStorage;