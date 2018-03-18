//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//

// Middleware to correlate bot responses to bot-test input

const debug = require("debug")("emulator:botTest");
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;
var interceptor = require('express-interceptor');

let botInterceptor = interceptor(function(req, res){
  return {
    // Only JSON responses will be intercepted 
    isInterceptable: function(){
      return /application\/json/.test(res.get('Content-Type'));
    },
    // See if this is a response that we've been waiting for
    intercept: function(body, send) {
      const db = req.app.locals.datastore;
      if (db.responses.isTrackedResponse(res, JSON.parse(body))) {
        debug('Holding the response while waiting for bot input...');
      } else {
        send(body);
      }
    }
  };
})


module.exports = botInterceptor;