const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:rooms");


function RoomStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
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
    this.data[room.id] = room;

    // Add creator to rom members
    this.datastore.memberships._add(person.id, room.id, person);

    return room;
}


RoomStorage.prototype.list = function (person) {

    assert.ok(person);

    // Retreive the memberships of the user
    // [TODO]  

    // Filter out the rooms the 
    var self = this;
    const list = Object.keys(this.data).map(function (key, index) {
        return self.data[key];
    }).sort(function (a, b) {
        return (a.lastActivity < b.lastActivity);
    });

    return list;
}


RoomStorage.prototype.find = function (person, roomId) {

    assert.ok(roomId);

    // [PENDING]
    //this.datastore.memberships.list

    var self = this;
    const list = Object.keys(this.data).map(function (key, index) {
        return self.data[key];
    }).sort(function (a, b) {
        return (a.lastActivity < b.lastActivity);
    });

    return list;
}

module.exports = RoomStorage;