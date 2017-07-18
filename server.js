const debug = require("debug")("emulator");
const fine = require("debug")("emulator:fine");

const express = require("express");
var bodyParser = require("body-parser");

const sendError = require("./error");

const app = express();

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });
app.use(router);

router.use(bodyParser.json()); // for parsing application/json

// [TODO] Add 'Trackingid' header

//
// Rooms resource
//
router.post("/rooms", function (req, res) {

    // Check authentication
    const auth = req.get("Authorization");
    if (!auth) {
        return sendError(res, 401);
    }

    // Check Media type
    const media = req.get("Content-Type");
    if (!media) {
        debug("no Content-Type specified");
        return sendError(res, 415, "Content type 'text/plain' not supported");
    }
    if (media !== "application/json") {
        debug(`bad 'Content-Type' specified: '${media}'`);
        return sendError(res, 415, `Content type '${media}' not supported`);
    }

    // Check incoming payload
    const incoming = req.body;
    if (!incoming) {
        return sendError(res, 400);
    }
    if (!incoming.title || (typeof incoming.title != "string")) {
        debug("missing title property in incoming payload");
        return sendError(res, 400);
    }

    // Create room

    // Return payload
    res.status(201).send();
});


const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log(`Emulator started on port: ${port}`);
});
