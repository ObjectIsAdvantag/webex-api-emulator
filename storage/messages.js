//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:messages");

// for manipulating markup
const MarkdownManipulator = require("./markdown-manipulator");

function MessageStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
    this.markdownManipulator = new MarkdownManipulator
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
        // Check if there are mentions in the markdown
        // If so replace the mention markup with the mention name
        // And add a mentionedPeople array
        let mentionInfo = this.markdownManipulator.buildMentionedPeopleArray(markdown);
        if (mentionInfo.mentionedPeople.length) {
            message.mentionedPeople = mentionInfo.mentionedPeople;
            message.markdown = mentionInfo.newMarkdown;
            message.text = this.markdownManipulator.convertMarkdownToHtml(mentionInfo.newText);
            message.text = message.text.replace(/<(?:.|\n)*?>/gm, '');
        } else {
            message.markdown = markdown;
        }
        message.html = this.markdownManipulator.convertMarkdownToHtml(message.markdown);
        if (!message.text) {
            message.text = message.html.replace(/<(?:.|\n)*?>/gm, '');
        }
    }
    // Spark doesn't like new lines in text!
    message.text = message.text.replace(/\n/gm, ' ');
    // Lets convert &gt; to '>' and &lt; to '<'
    message.text = message.text.replace(/&gt;/gm, '>');
    message.text = message.text.replace(/&lt;/gm, '<');
    
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

    // Check message exists
    const message = this.data[messageId];
    if (!message) {
        debug("message not found: ${messageId}");
        if (cb) {
            var err = new Error("message not found");
            err.code = "MESSAGE_NOT_FOUND";
            cb(err, null);
        }
        return;
    }
   
    // Check the user is part of the room
    this.datastore.rooms.find(actor, message.roomId, function (err, room) {
        if (err) {
            debug("forwarding error: ${err.message}");
            if (cb) {
                cb(err, null);
            }
            return;
        }

        // User is part of the room, and mesage found, let's return
        if (cb) {
            cb(null, message);
        }
    });
}

module.exports = MessageStorage;