//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:attachmentActions");


function AttachmentActionStorage(datastore) {
   this.datastore = datastore;
   this.data = {};
}

AttachmentActionStorage.prototype.create = function (actor, messageId, roomId, type, inputs, cb) {

   assert.ok(actor);
   assert.ok(messageId);
   assert.ok(roomId);
   assert.ok(type);
   assert.ok(inputs);

   // Create action
   const now = new Date(Date.now()).toISOString();
   let action = {
      "type": type,
      "messageId": messageId,
      "inputs" : inputs,
      "id": base64.encode("ciscospark://em/ATTACHMENT/" + uuid()),
      "personId": actor.id,
      "roomId": roomId
   }

   // Store message
   action.created = now;
   this.data[action.id] = action;

   if (cb) {
      cb(null, action);
   }

   // Emit event
   this.datastore.bus.emit('attachmentActions/created', actor, action);
}


AttachmentActionStorage.prototype.find = function (actor, actionId, cb) {

   assert.ok(actor);
   assert.ok(actionId);

   // Check message exists
   const action = this.data[actionId];
   if (!action) {
      debug("action not found: ${actionId}");
      if (cb) {
         var err = new Error("action not found");
         err.code = "ACTION_NOT_FOUND";
         cb(err, null);
      }
      return;
   }

   if (cb) {
      cb(null, action);
   }
}


module.exports = AttachmentActionStorage;