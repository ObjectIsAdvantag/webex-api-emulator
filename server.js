
const debug = require("debug")("emulator");
const express = require("express");
const app = express();
app.locals.started = new Date(Date.now()).toISOString();
app.set("x-powered-by", false);
app.set("etag", false);


//
// Loading services
//
const rooms = require("./rooms");
app.use("/rooms", rooms);


//
// Starting server
//
const port = process.env.PORT || 3000;
app.listen(port, function () {
    debug(`Emulator started on port: ${port}`);
    console.log(`Emulator started on port: ${port}`);
});
