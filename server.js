
const debug = require("debug")("emulator");
const express = require("express");
const app = express();


//
// Loading services
//
const rooms = require("./rooms");
app.use(rooms);


//
// Starting server
//
const port = process.env.PORT || 3000;
app.listen(port, function () {
    debug(`Emulator started on port: ${port}`);
    console.log(`Emulator started on port: ${port}`);
});
