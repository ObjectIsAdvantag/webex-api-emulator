const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:controller");


function Controller(bus) {
    this.bus = bus;

    bus.on('messages/created', function (actor, message) {
        debug(`new message: ${message.id}`)
    });
}


module.exports = Controller;