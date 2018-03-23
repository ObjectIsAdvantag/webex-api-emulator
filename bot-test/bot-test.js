//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//

// Middleware to look for X-Bot-Test

const debug = require("debug")("emulator:botTest");
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;

let botTest = {};
let testIdCounter = 1;

// Load pre-registered tokens so we can get bot info
var tokens = require('../tokens.json');
if (!tokens) {
    tokens = {};
}


botTest.middleware = function (req, res, next) {

    // Public resources
    if ((req.path == "/") || (req.path == "/tokens")) {
        next();
    }

    debug('New Request from: '+ res.locals.person.emails[0]);
    debug(req.method + ': ' + req.url);
    if (req.method == 'GET') {
        debug(req.params);
    } else {
        debug(req.body);
    }

    let botUnderTestEmail = req.app.locals.botUnderTestEmail
    // The first time we see a request from the bot save its token
    // so we can look up info about it later
    if ((!req.app.locals.botActor) && (res.locals.person.emails[0] == botUnderTestEmail)) {
        const auth = req.get("Authorization");
        // Extract token -- no error checking since we already passed auth
        const splitted = auth.match(/^Bearer\s([0-9a-zA-Z]*)$/);
        // Retreive Person from token
        const token = splitted[1];
        req.app.locals.botActor = tokens[token];
    }

    // Check if this is a test request that should generate bot requests 
    const botTestHeader = req.get("X-Bot-Responses");
    if (botTestHeader) {
        debug('Found X-Bot-Test header: %s\n', botTestHeader);
        const db = req.app.locals.datastore;
        db.responses.initResponseObj(req, res, testIdCounter++);
    } else {
        debug('\n');
        if(res.locals.person.emails[0] == botUnderTestEmail) {
            //See if this is a bot request in response to a test input
            const db = req.app.locals.datastore;
            if (db.responses.isTrackedBotResponse(req)) {
                debug('Updated response to test framework with bot request');
            }  
        }
    }
    
    // Check if this is a request from the bot under test

    next();
}


module.exports = botTest;