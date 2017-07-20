const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:messages");


function MessageStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
}

MessageStorage.prototype.createInRoom = function (actor, room, text, markdown, file, cb) {

    assert.ok(actor);
    assert.ok(room);
    assert.ok(text || markdown || file);

    // Create message
    const now = new Date(Date.now()).toISOString();
    var message = {
        "id": base64.encode("ciscospark://em/MESSAGE/" + uuid()),
        "roomId": room.id,
        "roomType": room.type,
        "text": text,
        "personId": actor.id,
        "personEmail": actor.emails[0]
    }

    // Append markdown properties
    if (markdown) {
        // [TODO] build raw text from markdown
        message.text = markdown;
        message.markdown = markdown;
        // [TODO] build html from markdown
        // var md = require('markdown-it')({ html: true })
        // .use(require('markdown-it-sanitizer'));
        // md.render('<b>test<p></b>'); // => '<p><b>test</b></p>' 
        message.html = markdown;
    }

    // Store message
    message.created = now;
    this.data[message.id] = message;

    if (cb) {
        cb(null, message);
    }

    // Emit event
    this.datastore.bus.emit('messages/created', actor, message);
}


MessageStorage.prototype.listAllInRoom = function (actor, roomId, cb) {

    assert.ok(actor);
    assert.ok(roomId);

    // List messages for room, order by created date DESC
    const self = this;
    var messages = [];
    Object.keys(this.data).forEach(function (key) {
        let message = self.data[key];
        if (message.roomId == roomId) {
            messages.push(message);
        }
    });

    messages.sort(function (a, b) {
        return (a.created < b.created);
    });

    if (cb) {
        return cb(null, messages);
    }
}


MessageStorage.prototype.find = function (actor, messageId, cb) {

    assert.ok(actor);
    assert.ok(messageId);

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


module.exports = MessageStorage;