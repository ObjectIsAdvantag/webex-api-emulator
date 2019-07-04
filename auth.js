//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const debug = require("debug")("emulator:auth");
const sendError = require('./utils').sendError;
const sendSuccess = require('./utils').sendSuccess;


const authentication = {};

// Load pre-registered tokens
var tokens = require('./tokens.json');
if (!tokens) {
    tokens = {};
}
authentication.tokens = tokens;

authentication.middleware = function (req, res, next) {
    // Public resources
    if ((req.path == "/") || (req.path == "/tokens")) {
        next();
    }

    // Check authentication
    const auth = req.get("Authorization");
    if (!auth) {
      debug("No Authentication header");
      return _sendAuthenticationError(res);
    }

    // Extract token
    const splitted = auth.match(/^Bearer\s([0-9a-zA-Z]*)$/);
    if (!splitted || (splitted.length != 2)) {
        debug("Authentication token does not match 'Bearer [0-9a-zA-Z]*' pattern");
        return _sendAuthenticationError(res);
    }

    // Retreive Person from token
    const token = splitted[1];
    const account = tokens[token];
    if (!account) {
        debug("No account found for token: " + token);
        return _sendAuthenticationError(res);
    }

    // Add person to request context
    res.locals.person = account;

    next();
}

// Webex standard message
// {
//    "message": "The request requires a valid access token set in the Authorization request header.",
//    "errors": [
//        {
//            "description": "The request requires a valid access token set in the Authorization request header."
//        }
//    ],
//    "trackingId": "ROUTER_5D1DCAC2-63EF-01BB-007E-AD26DC3A007E"
// }
function _sendAuthenticationError(res) {
   sendError(res, 401, "The request requires a valid access token set in the Authorization request header.");
}


module.exports = authentication;