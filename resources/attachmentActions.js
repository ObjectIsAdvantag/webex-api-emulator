//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const debug = require("debug")("emulator:messages");
const express = require("express");

// default routing properties to mimic Webex
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json());

// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;


// Create an AttachmentAction
router.post("/", function (req, res) {
   const db = req.app.locals.datastore;
   const actor = res.locals.person;

   // Check Media type
   const media = req.get("Content-Type");
   if (!media) {
      debug("no Content-Type specified");
      return sendError(res, 415, "Content type 'text/plain' not supported");
   }
   if (!media.startsWith("application/json")) {
      debug(`bad 'Content-Type' specified: '${media}'`);
      return sendError(res, 415, `Content type '${media}' not supported`);
   }

   // Check incoming payload
   const incoming = req.body;
   if (!incoming) {
      return sendError(res, 400);
   }

   // What is the type of action
   // Only 'submit' is supported
   const type = incoming.type;
   if (!type) {
      debug(`no type specified`);
      return sendError(res, 400, "TEMP: no type specified");
   }
   if (type !== "submit") {
      debug(`unknown type: ${type}, only submit is supported`);
      return sendError(res, 400, "TEMP: only type supported is submit");
   }

   // Retrieve the room for the message
   const messageId = incoming.messageId;
   if (!messageId) {
      debug(`no messageId specified`);
      return sendError(res, 400, "TEMP: message identifier is required");
   }
   db.messages.find(actor, messageId, function (err, message) {
      if (err) {
         switch (err.code) {
            case "MESSAGE_NOT_FOUND":
               debug("message ${messageId} not found.")
               // Note that this is the message returned by Webex, time of this writing
               return sendError(res, 404, "Unable to delete message.");
            case "ROOM_NOT_FOUND":
            case "USER_NOT_IN_ROOM":
               debug("Could not find a room with provided ID.")
               return sendError(res, 404, "Could not find a room with provided ID.");
            default:
               debug(`unexpected error, cannot retrieve details for room: ${messageId}`);
               return sendError(res, 500, "[EMULATOR] unexpected error, cannot retrieve room details");
         }
      }

      // Check there is a card for the message
      if (!message.attachments) {
         debug(`message with id: ${message.id} does not have attachements`);
         sendError(res, 400, "Unable to post attachment action: \"MessageId should point to an activity with cards\"");
         return;
      }

      // The author of a card cannot post an attachment
      if (message.personId == actor.id) {
         debug("The author of a card cannot post an attachment");
         sendError(res, 400, "Unable to post attachment action: \"Author of a card cannot submit a cardAction on that card\"")
         return;
      }

      // [TODO] Check the submitted data match the card definition
      const inputs = incoming.inputs;

      // Create AttachmentAction
      db.attachmentActions.create(actor, messageId, message.roomId, type, inputs, function (err, action) {
         if (err) {
            debug("unexpected error: " + err.message);
            sendError(res, 500, "[EMULATOR] cannot create AttachmentAction, unexpected error");
            return;
         }

         // Return payload
         // Note that Webex returns 200 OK and not a 201 CREATED here
         return sendSuccess(res, 200, action);
      });
   });

   return;
});




// Get Attachement Action details
router.get("/:id", function (req, res) {
   const db = req.app.locals.datastore;
   const actor = res.locals.person;

   const actionId = req.params.id;
   db.attachmentActions.find(actor, actionId, function (err, action) {
      if (err) {
         switch (err.code) {
            case "ACTION_NOT_FOUND":
               debug(`action ${actionId} not found.`)
               // Note that this is the message returned by Webex, time of this writing
               return sendError(res, 404, "Unable to get attachment action.");
            default:
               debug(`unexpected error, cannot retrieve details for action: ${actionId}`);
               return sendError(res, 500, "[EMULATOR] unexpected error, cannot retrieve room details");
         }
      }

      // Check the actor is the creator of the card
      db.messages.find(actor, action.messageId, function (err, message) {
         if (err) {
            switch (err.code) {
               case "MESSAGE_NOT_FOUND":
                  debug(`message ${messageId} not found.`)
                  return sendError(res, 404, "TEMP - Action not found.");
               case "ROOM_NOT_FOUND":
                  debug(`Could not find room for message: ${message.id}`);
                  return sendError(res, 404, "TEMP - Action not found");
               case "USER_NOT_IN_ROOM":
                  debug(`Seems the actor is not a member of the room which holds message: ${action.messageId}`);
                  return sendError(res, 404, "TEMP - Action not found");
               default:
                  debug(`unexpected error, cannot retrieve details for room: ${messageId}`);
                  return sendError(res, 500, "[EMULATOR] unexpected error, cannot retrieve room details");
            }
         }

         return sendSuccess(res, 200, action);
      });
   });
});


module.exports = router;