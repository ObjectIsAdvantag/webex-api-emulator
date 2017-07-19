const debug = require("debug")("emulator:storage");
const fine = require("debug")("emulator:storage");

// 
// Init store
//
var datastore = {};
const RoomStorage = require("./rooms");
datastore.rooms = new RoomStorage(datastore);
const MembershipStorage = require("./memberships");
datastore.memberships = new MembershipStorage(datastore);
const PersonStorage = require("./people");
datastore.people = new PersonStorage(datastore);

module.exports = datastore;
