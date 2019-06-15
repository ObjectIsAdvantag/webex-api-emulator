//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const removeMd = require('remove-markdown');
const showdown  = require('showdown');
const converter = new showdown.Converter();

const debug = require("debug")("emulator:storage:messages");


function MessageStorage(datastore) {
   this.datastore = datastore;
   this.data = {};
}

MessageStorage.prototype.createInRoom = function (actor, room, text, markdown, file, attachments, cb) {

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
      message.markdown = markdown;
      
      // build raw text from markdown
      message.text = removeMd(markdown);
      
      // build html from markdown 
      message.html = converter.makeHtml(markdown);
   }

   // Append attachments
   if (attachments) {
      message.attachments = attachments;
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