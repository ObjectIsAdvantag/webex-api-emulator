
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
// Middleware to mimic Cisco Spark HTTP headers
app.use(function (req, res, next) {
    res.setHeader("Cache-Control", "no-cache"); // to mimic Cisco Spark headers

    // New Trackingid
    res.locals.trackingId = "EM_" + uuid();
    res.setHeader("Trackingid", res.locals.trackingId);

    next();
});

// Middleware to enforce authentication
const authentication = require("./auth");
app.use(authentication.middleware);
// Extra service to dynamically create accounts
//app.use("/accounts", authentication.router);


//
// Loading services
//
const people = require("./people");
app.use("/people", people);
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
