
const debug = require("debug")("emulator");
const express = require("express");
const uuid = require('uuid/v4');
const sendError = require("./error");

//
// Setting up common services 
//
const app = express();
app.set("x-powered-by", false); // to mimic Cisco Spark headers
app.set("etag", false); // to mimic Cisco Spark headers

// authentication
app.use(function (req, res, next) {
    res.setHeader("Cache-Control", "no-cache"); // to mimic Cisco Spark headers

    // New Trackingid
    res.locals.trackingId = "EM_" + uuid();
    res.setHeader("Trackingid", res.locals.trackingId);

    // Check authentication
    const auth = req.get("Authorization");
    if (!auth) {
        return sendError(res, 401);
    }

    next();
});


//
// Loading services
//
const rooms = require("./rooms");
app.use("/rooms", rooms);


//
// Starting server
//
const port = process.env.PORT || 3000;
app.locals.started = new Date(Date.now()).toISOString();
app.listen(port, function () {
    debug(`Emulator started on port: ${port}`);
    console.log(`Emulator started on port: ${port}`);
});
