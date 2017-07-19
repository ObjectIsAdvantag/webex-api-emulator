const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:rooms");


function RoomStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
}

RoomStorage.prototype.create = function (person, title, type, cb) {

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

    if (cb) {
        cb(null, room);
    }
}


RoomStorage.prototype.list = function (person, cb) {

    assert.ok(person);

    // DEPRECATED: We need to filter out the rooms the person is not part of
    // var self = this;
    // const list = Object.keys(this.data).map(function (key, index) {
    //     return self.data[key];
    // }).sort(function (a, b) {
    //     return (a.lastActivity < b.lastActivity);
    // });

    // 
    this.listMyRooms(person, cb);
}


// Filters out the rooms the person is not part of
RoomStorage.prototype.listMyRooms = function (person, cb) {

    assert.ok(person);

    // List user memberships
    const self = this;
    this.datastore.memberships.listUserMemberships(person, function(err, memberships) {
        if (err) {
            debug("unpected err: " + err.message);
            if (cb) {
                cb(err, null);
            }
            return;
        }

        // Create a list of rooms for the user memberships
        var rooms = memberships.map(function(elem, index) {
            return self.data[elem.roomId];
        }).sort(function (a, b) {
        return (a.lastActivity < b.lastActivity);
        });

        if (cb) {
            return cb(null, rooms);
        }
    });
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