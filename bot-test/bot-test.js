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