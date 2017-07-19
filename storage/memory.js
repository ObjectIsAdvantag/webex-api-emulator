const debug = require("debug")("emulator:storage");
const fine = require("debug")("emulator:storage");


// 
// Init store
//
var datastore = {};
const PersonStorage = require("./people");
datastore.people = new PersonStorage(datastore);
const RoomStorage = require("./rooms");
datastore.rooms = new RoomStorage(datastore);
const MembershipStorage = require("./memberships");
datastore.memberships = new MembershipStorage(datastore);
const MessageStorage = require("./messages");
datastore.messages = new MessageStorage(datastore);


module.exports = datastore;
