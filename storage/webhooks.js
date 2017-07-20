const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:webhooks");


function WebhookStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
}

WebhookStorage.prototype.create = function (actor, title, type, cb) {

    assert.ok(actor);
    assert.ok(title);
    assert.ok(type);

    // Create room
    const now = new Date(Date.now()).toISOString();
    var room = {
        "id": base64.encode("ciscospark://em/ROOM/" + uuid()),
        "title": title,
        "type": type,
        "isLocked": false,
        "lastActivity": now,
        "creatorId": actor.id,
        "created": now
    }

    // Store room
    this.data[room.id] = room;

    // Add creator to rom members
    this.datastore.memberships._add(actor.id, room.id, actor);

    if (cb) {
        cb(null, room);
    }
}

// Filters out the rooms the person is not part of
WebhookStorage.prototype.list = function (actor, cb) {

    assert.ok(actor);

    // List webhooks for actor, order by created date DESC
    const self = this;
    var webhooks = [];
    Object.keys(this.data).forEach(function (key) {
        let webhook = self.data[key];
        if (webhook.createdBy == actor.id) {
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


WebhookStorage.prototype.find = function (actor, roomId, cb) {

    assert.ok(actor);
    assert.ok(roomId);

    // Check room exists
    const room = this.data[roomId];
    if (!room) {
        debug("room not found");
        if (cb) {
            var err = new Error("room not found");
            err.code = "ROOM_NOT_FOUND";
            cb(err, null);
        }
        return;
    }

    // Check the user is part of the room
    this.datastore.memberships.listUserMemberships(actor, function (err, memberships) {
        if (err) {
            debug("unexpected error: ${err.message}");
            if (cb) {
                cb(err, null);
            }
            return;
        }

        var found = false;
        memberships.map(function (elem) {
            if (elem.roomId == roomId) {
                found = true;
            }
        });

        if (!found) {
            debug("user is not part of the room");
            if (cb) {
                var err = new Error("user is not part of the room");
                err.code = "USER_NOT_IN_ROOM";
                cb(err, null);
            }
            return;
        }

        if (cb) {
            cb(null, room);
        }
    });
}

module.exports = WebhookStorage;