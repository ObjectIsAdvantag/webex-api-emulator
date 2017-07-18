
const debug = require("debug")("emulator:auth");
const sendError = require("./error");

const authentication = {};

// Load pre-registered tokens
var tokens = require('./tokens.json');
if (!tokens) {
    tokens = {};
}
authentication.tokens = tokens;

authentication.middleware = function (req, res, next) {
    // Check authentication
    const auth = req.get("Authorization");
    if (!auth) {
        return sendError(res, 401);
    }

    // Extract token
    const splitted = auth.match(/^Bearer\s([0-9a-zA-Z]*)$/);
    if (!splitted || (splitted.length != 2)) {
        debug("Authentication token does not match 'Bearer [0-9a-zA-Z]*' pattern");
        return sendError(res, 401);
    }

    // Retreive Person from token
    const token = splitted[1];
    const account = tokens[token];
    if (!account) {
        debug("No account found for token: " + token);
        return sendError(res, 401);
    }
    res.locals.person = account;

    // Update user activity
    account.lastActivity = new Date(Date.now()).toISOString();
    tokens[token] = account;

    next();
}


module.exports = authentication;