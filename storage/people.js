const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const debug = require("debug")("emulator:storage:people");


function PersonStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
}

// Initialize the store with a list of prepared accounts
PersonStorage.prototype.init = function (accounts) {
    var self = this;
    accounts.forEach(function (elem) {
        self.data[elem.id] = elem;
    });
}

PersonStorage.prototype.find = function (personId, cb) {

    assert(personId);

    const person = this.data[personId];
    if (!person) {
        debug(`could not find Person with id: ${personId}`);
        if (cb) {
            var err = new Error(`could not find Person with id: ${personId}`);
            err.code = "PERSON_NOT_FOUND";
            cb(err, null);
            return;
        }
    }

    cb(null, person);
}


module.exports = PersonStorage;