//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:memberships");


function MembershipStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
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
    Object.keys(this.data).map(function (key, index) {
        var elem = self.data[key];
        if (elem.roomId == roomId) {
            if (elem.personId == actor.id) {
                foundActor = true;
            }
            if (elem.personId == newMemberId) {
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
            cb(err, null);
        }
        return;
    }

    if (foundNewMember) {
        debug("participant is already a member of the room");
        if (cb) {
            var err = new Error("participant is already a member of the room");
            err.code = "ALREADY_A_MEMBER";
            cb(err, null);
        }
        return;
    }

    // Retreive detailed person info
    this.datastore.people.find(actor, newMemberId, function (err, person) {
        if (err) {
            debug(`details not found for person: ${newMemberId}`);
            if (cb) {
                var err2 = new Error("details not found for specified person");
                err2.code = "PERSON_NOT_FOUND";
                cb(err2, null);
            }
            return;
        }

        // Create membership
        var membership = self.datastore.memberships._add(actor.id, roomId, person);

        // Invoke callback
        if (cb) {
            cb(null, membership);
        }

        // Emit event
        self.datastore.bus.emit('memberships/created', actor, membership);
    });
}


MembershipStorage.prototype._add = function (actorId, roomId, newMember) {

    assert.ok(actorId);
    assert.ok(roomId);
    assert.ok(newMember);

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
    this.data[membership.id] = membership;

    // Fire event
    // [TODO]

    return membership;
}


MembershipStorage.prototype.listMembershipsForRoom = function (actor, roomId, cb) {

    assert.ok(actor);
    assert.ok(roomId);

    var list = [];
    var self = this;
    var found = false;
    Object.keys(this.data).forEach(function (elem) {
        var membership = self.data[elem];
        if (membership.roomId == roomId) {
            list.push(membership);
            if (actor.id == membership.personId) {
                found = true;
            }
        }
    });

    if (!found) {
        var err = new Error(`membership found but the user: ${actor.id} is not part of room: ${roomId}`);
        err.code = "NOT_MEMBER_OF_ROOM";
        if (cb) {
            cb(err, null);
        }
        return;
    }

    // Sort by creation date DESC
    // [TODO] check Spark ordering
    list = list.sort(function (a, b) {
        return (a.created < b.created);
    });

    if (cb) {
        cb(null, list);
    }
}


MembershipStorage.prototype.listUserMemberships = function (actor, cb) {

    assert.ok(actor);

    var list = [];
    var self = this;
    Object.keys(this.data).forEach(function (elem) {
        var membership = self.data[elem];
        if (actor.id == membership.personId) {
            list.push(membership);
        }
    });

    // Sort by creation date DESC
    // [TODO] check Spark ordering
    list = list.sort(function (a, b) {
        return (a.created < b.created);
    });

    if (cb) {
        cb(null, list);
    }
}


MembershipStorage.prototype.find = function (actor, membershipId, cb) {

    assert.ok(actor);
    assert.ok(membershipId);

    // Check membership exists
    const membership = this.data[membershipId];
    if (!membership) {
        debug(`membership does not exists with id: ${membershipId}`);
        if (cb) {
            var err = new Error(`membership does not exists with id: ${membershipId}`);
            err.code = "MEMBERSHIP_NOT_FOUND";
            cb(err, null);
        }
        return;
    }

    // Check the user is part of the room
    var self = this;
    var found = false;
    Object.keys(this.data).forEach(function (key) {
        var elem = self.data[key];
        if (membership.roomId == elem.roomId) {
            if (actor.id == elem.personId) {
                found = true;
            }
        }
    });
    if (!found) {
        var err = new Error(`membership found but the user: ${actor.id} is not part of room: ${membership.roomId}`);
        err.code = "NOT_MEMBER_OF_ROOM";
        if (cb) {
            cb(err, null);
        }
        return;
    }

    if (cb) {
        cb(null, membership);
    }
}


// Deletes a membership if the user is part of the room and it exists
MembershipStorage.prototype.delete = function (actor, membershipId, cb) {

    assert.ok(actor);
    assert.ok(membershipId);

    // Check membership exists
    const membership = this.data[membershipId];
    if (!membership) {
        debug(`membership does not exists with id: ${membershipId}`);
        if (cb) {
            var err = new Error(`membership does not exists with id: ${membershipId}`);
            err.code = "MEMBERSHIP_NOT_FOUND";
            cb(err, null);
        }
        return;
    }

    // Check the user is part of the room
    var self = this;
    var found = false;
    Object.keys(this.data).forEach(function (key) {
        var elem = self.data[key];
        if (membership.roomId == elem.roomId) {
            if (actor.id == elem.personId) {
                found = true;
            }
        }
    });
    if (!found) {
        var err = new Error(`membership found but the user: ${actor.id} is not part of room: ${membership.roomId}`);
        err.code = "NOT_MEMBER_OF_ROOM";
        if (cb) {
            cb(err, null);
        }
        return;
    }

    // Delete membership as the user is part of the room
    // GOOD TO KNOW: Note we do not need to check for Moderation as it is not proposed
    delete (this.data[membershipId]);

    // [TODO] Fire event
    this.datastore.bus.emit('memberships/deleted', actor, membership);


    if (cb) {
        cb(null, membership);
    }
}


module.exports = MembershipStorage;