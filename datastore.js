

const debug = require("debug")("emulator:datastore");
const assert = require("assert")

// Extra imports 
const uuid = require('uuid/v4');
const base64 = require('base-64');


//
// Rooms
//

function RoomStorage() {
    this.rooms = {};
}

RoomStorage.prototype.create = function (person, title, type) {

    assert.ok(person);
    assert.ok(title);
    assert.ok(type);

    // Create room
    const now = new Date(Date.now()).toISOString();
    var room = {
        "id": base64.encode("ciscospark://em/ROOM/" + uuid()),
        "title": title,
        "type": type,
        "isLocked": false,
        "lastActivity": now,
        "creatorId": person.id,
        "created": now
    }

    // Store room
    this.rooms[room.id] = room;

    return room;
}


RoomStorage.prototype.list = function listRooms(person) {
    var self = this;
    const list = Object.keys(this.rooms).map(function (key, index) {
        return self.rooms[key];
    }).sort(function (a, b) {
        return (a.lastActivity < b.lastActivity);
    });

    return list;
}

// 
// Init store
//
var datastore = {};
datastore.rooms = new RoomStorage();
module.exports = datastore;
