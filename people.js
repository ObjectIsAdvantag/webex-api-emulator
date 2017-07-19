
const debug = require("debug")("emulator:people");
const express = require("express");

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json()); 
    
// Extra imports 
const sendError = require('./utils').sendError;
const sendSuccess = require('./utils').sendSuccess;


// List people
router.get("/", function (req, res) {
    sendError(res, 400, "Email, displayName, or id list should be specified.");
});


// Show current user
router.get("/me", function (req, res) {

    const personId = res.locals.person.id;
    const db = req.app.locals.datastore;
    db.people.find(personId, function (err, person) {
        if (!err) {
            return sendSuccess(res, 200, person);
        }

        // [PENDING] handle error cases 
        debug(`unexpected error, cannot retrieve account info for personId: ${personId}`);
        return res.sendError("500", "[EMULATOR] unexpected error, cannot retrieve account info");
    });
});


module.exports = router;