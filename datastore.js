

const debug = require("debug")("emulator:datastore");
const fine = require("debug")("emulator:datastore");
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


RoomStorage.prototype.list = function (person) {

    assert.ok(person);

    // Retreive the memberships of the user
    // [TODO]  

    // Filter out the rooms the 
    var self = this;
    const list = Object.keys(this.rooms).map(function (key, index) {
        return self.rooms[key];
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

MembershipStorage.prototype.create = function (actor, roomId, newMemberId, isModerator, cb) {

    assert.ok(actor);
    assert.ok(roomId);
    assert.ok(newMemberId);
    // Moderation not supported
    assert.ok(isModerator == false);

    // Check actor is a member of the room and that the person is not already a member
    // 1. List Room Membership
    // 2. Check actor
    // 3. Check person

    const self = this;
    var foundActor = false;
    var foundNewMember = false;
    Object.keys(this.memberships).map(function (key, index) {
        var elem = self.memberships[key];
        if (elem.id == roomId) {
            if(elem.personId == actor.id) {
                fine(`createMEmbership: found actor in room: ${roomId}`);
                foundActor = true;
            }
            if(elem.personId == newMemberId) {
                fine(`createMEmbership: found new member in room: ${roomId}`);
                foundNewMember = true;
            }
            return elem;
        }
    });

    if (!foundActor) {
        debug("cannot create membership in a room the actor is not part of");
        if (cb) {
            var err = new Error("cannot create membership in a room the actor is not part of");
            err.code = "NOT_A_MEMBER";
            cb (err, null);
        }
        return;
    }

    if (foundNewMember) {
        debug("participant is already a member of the room");
        if (cb) {
            var err = new Error("participant is already a member of the room");
            err.code = "ALREADY_A_MEMBER";
            cb (err, null);
        }
        return;
    }

    // Retreive detailed person info
    const personDetails = this.datastore.people[newMemberId];
    if (!personDetails) {
        debug(`details not found for person: ${newMemberId}`);
        if (cb) {
            var err = new Error("details not found for specified person");
            err.code = "PERSON_NOT_FOUND";
            cb (err, null);
        }
        return;
    }
    
    // Create membership
    const now = new Date(Date.now()).toISOString();
    var membership = {
        "id": base64.encode("ciscospark://em/MEMBERSHIP/" + uuid()),
        "roomId": roomId,
        "personId": newMember.id,
        "personEmail": newMember.emails[0],
        "personDisplayName": newMember.displayName,
        "personOrgId": newMember.orgId,
        "isModerator": false,
        "isMonitor": false,
        "created": new Date(Date.now()).toISOString()
    }

    // Store membership
    this.memberships[membership.id] = membership;

    // Fire event
    // [TODO]

    // Invoke callback
    if (cb) {
        cb(null, membership);
    }
}


MembershipStorage.prototype.list = function (actor, cb) {

    assert.ok(actor);

    var self = this;
    const list = Object.keys(this.memberships).map(function (key, index) {
        var elem = self.memberships[key];
        if (actor.id == elem.personId) {
            return elem;
        }
    }).sort(function (a, b) {
        return (a.roomId > b.roomId);
    });


    if (cb) {
        cb(null, list);
    }
}

MembershipStorage.prototype.list = function (actor, cb) {

    assert.ok(actor);

    var self = this;
    const list = Object.keys(this.memberships).map(function (key, index) {
        var elem = self.memberships[key];
        if (actor.id == elem.personId) {
            return elem;
        }
    }).sort(function (a, b) {
        return (a.roomId > b.roomId);
    });


    if (cb) {
        cb(null, list);
    }
}


MembershipStorage.prototype.find = function (actor, membershipId, cb) {

    assert.ok(actor);
    assert.ok(membershipId);

    // Check membership exists
    const membership = this.memberships[membershipId];
    if (!membership) {
        debug(`membership does not exists with id: ${membershipId}`);
        if (cb) {
            var err = new Error(`membership does not exists with id: ${membershipId}`);
            err.code = "MEMBERSHIP_NOT_FOUND";
            cb(err, null);
        }
    }

    // Check the user is part of the room
    var self = this;
    const memberships = Object.keys(this.memberships).map(function (key, index) {
        var elem = self.memberships[key];
        if (membership.roomId == elem.roomId) {
            if (actor.id == elem.personId) {
                return elem;
            }
        }
    });
    if (memberships.lenght == 1) {
        if (cb) {
            cb(null, memberships[0]);
        }
        return;
    }

    var err = new Error(`membership found but the user is not part of the room with id: ${membership.roomId}`);
    err.code = "MEMBERSHIP_NOT_FOUND";
    if (cb) {
        cb(err, null);
    }
}



// 
// Init store
//
var datastore = {};
datastore.rooms = new RoomStorage(datastore);
datastore.memberships = new MembershipStorage(datastore);
module.exports = datastore;
