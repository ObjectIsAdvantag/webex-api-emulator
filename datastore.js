

const debug = require("debug")("emulator:datastore");
const assert = require("assert")

// Extra imports 
const uuid = require('uuid/v4');
const base64 = require('base-64');


//
// Rooms
//

function RoomStorage(datastore) {
    this.datastore = datastore;
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
// Memberships
//

function MembershipStorage(datastore) {
    this.datastore = datastore;
    this.memberships = {};
}

MembershipStorage.prototype.create = function (person, roomId, personId, cb) {

    assert.ok(person);
    assert.ok(roomId);
    assert.ok(personId);
    assert.ok(cb);

    //
    // Consistency checks
    //

    // Check person is part of the room

    // Check person exists and retreive its email

    // Check person is not already a member of the room

    // Create membership
    const now = new Date(Date.now()).toISOString();
    var room = {
        "id": base64.encode("ciscospark://em/MEMBERSHIP/" + uuid()),
        "roomId": title,
        "personId": type,
        "personEmail": person.emails[0],
        "personDisplayName": person.displayName,
        "personOrgId": person.orgId,
        "isModerator": false,
        "isMonitor": false,
        "created": new Date(Date.now()).toISOString()
    }

    // Store membership
    this.memberships[membership.id] = membership;

    cb(null, membership);
}


// 
// Init store
//
var datastore = {};
datastore.rooms = new RoomStorage(datastore);
datastore.memberships = new MembershipStorage(datastore);
module.exports = datastore;
