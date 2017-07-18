
const debug = require("debug")("emulator:people");
const express = require("express");

// default routing properties to mimic Cisco Spark
const router = express.Router({ "caseSensitive": true, "strict": false });

// for parsing application/json
const bodyParser = require("body-parser");
router.use(bodyParser.json()); 

//
// Load static accounts database
//
const authentication = require('./auth');
// var accounts = Object.keys(authentication.tokens).map(function(key, index) {
//         const person = authentication.tokens[key];
//         var value = {}
//         value[person.id] = person;
//         return value;
//     });
var accounts = {};
Object.keys(authentication.tokens).forEach(function(item, index) {
    const person = authentication.tokens[item];
    accounts[person.id] = person;
});
    

// Extra imports 
const sendError = require('./error');


// List people
router.get("/", function (req, res) {

    // Return list of rooms ordered by lastActivity
    const list = Object.keys(accounts).map(function(key, index) {
        return accounts[key];
    }).sort(function(a, b) {
        return (a.displayName < b.displayName);
    });

    res.status(200).send({ "items" : list });
});

module.exports = router;