//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//

/*
 * Helper module to manipulate response from the spark emulator
 * The emulator inspects all requests.  Requests from the test framework
 * that emulate user activity may include an X-Bot-Response header.
 * When this headers has a value greater than zero the emulator framework
 * will intercept responses and hold the response to the test request
 * until it also recieves the coorect number of responses to bot requests
 * as well
 * 
 */

const debug = require("debug")("emulator:botTest");
const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
// Extra imports 
const sendError = require('../utils').sendError;
const sendSuccess = require('../utils').sendSuccess;


function ResponseStorage(datastore) {
    this.datastore = datastore;
    this.data = [];
}

ResponseStorage.prototype.initResponseObj = function (req, res, testId) {

    assert.ok(req);
    let expectedBotResponses = req.get('X-Bot-Responses');

    // Set the testId in the request header so we can catch the initial
    // response to the request from the test framework
    res.setHeader('X-Bot-Test-Id', testId);

    // Create an object for building the response to the test framework
    var respObj = {
        "testId": testId,
        "response": {},
        "expectedBotResponses": parseInt(req.get('X-Bot-Responses')),
        "seenBotResponses": 0,
        "roomId": '',
        "membershipId": ''
    }

    // Store reqObj
    this.data[testId] = respObj;
}

ResponseStorage.prototype.removeResponseObj = function (index) {

    this.data.splice(index);
}

// Check if this is a response to a request with a tracking ID
// If so save the response object so we can send it after we get
// the expected bot responses
ResponseStorage.prototype.isTrackedResponse = function(response, body) {
    if (!this.data.length) {
        return false;
    }

    assert.ok(response);
    if (response.statusCode != 200) {
        return false;
    }

    let testId = response.get('X-Bot-Test-Id');
    if ((!testId) || (!this.data[testId])) {
        return false;
    }

    let respObj = this.data[testId];
    if (respObj.roomId) {
        // This did generate a warning since we dont expect to get here
        // without seeing at least one bot corellated bot requets
        // There may be circumstances however where we correlate with 
        // something other than the roomId though
    } else {
        // This is the response to the original spark API request from the 
        // test framework.  Store it now to send after we see all the 
        // expected bot requests in response to the test input
        respObj.response = response;
        respObj.body = body;
        // Add the roomId which we'll use to correlate bot responses
        respObj.roomId = body.roomId;
        // If the bot is in this room, store its membershipID
        if (response.req.app.locals.botActor) {
            const actor = response.req.app.locals.botActor;
            if (body.roomId) {
                const db = response.req.app.locals.datastore;
                db.memberships.listMembershipsForRoom(actor, body.roomId, function (err, list) {
                    if ((!err) && (list.length)) {
                        for (var i=0; i<list.length; i++) {
                            if (list[i].personId == actor.id) {
                                respObj.membershipId = list[i].id;
                                break;
                            }
                        }
                    }
                });
            }
        }
        return true;
    }
    return false;
}

// Check if this is a bot request in response to a test request 
// If so save the info about the request in the test framework response
ResponseStorage.prototype.isTrackedBotResponse = function(req) {
    if (!this.data.length) {
        return false;  // No test requests awaiting responses
    }

    assert.ok(req);
    if (req.method == 'GET') {
        return false;  // Not interested in responses to webhooks
    }

    let id = '';
    let keyName = '';
    if (req.method == 'DELETE') {
        let parts = req.url.split('/')
        let endpoint = parts[1];
        if (endpoint === 'memberships') {
            id = parts[2];
            keyName = 'membershipId';
        }
    } else {
        id = req.body.roomId;
        keyName = 'roomId'
    }
    // Iterate through all the stored responses until
    // we find one with this roomID
    const self = this;
    let respObjs = [];
    let index = 0;
    Object.keys(this.data).forEach(function (key) {
        let respObj = self.data[key];
        if (respObj[keyName] == id) {
            index = key;
            respObjs.push(respObj);
        }
    });
    debug('Found %d test framework responses that match bot request', respObjs.length);
    if (!respObjs.length) {
        return false;
    } else if (respObjs.length > 1) {
        // Need a better way to deal with this
        console.error('Too many saved responses that match this room!  Bailing')
        return false;
    } else {
        // This must be a BotResponse that correlates to an earlier
        // request from the test framework.  Add it to the response 
        let respObj = respObjs[0];
        if (!respObj.seenBotResponses) {
            respObj.body = buildComplexResponseBody(respObj.body, req);
        } else {
            respObj.body = addToComplexResponseBody(respObj.body, req);            
        }
        respObj.seenBotResponses += 1;
        if (respObj.seenBotResponses == respObj.expectedBotResponses) {
            debug("Saw all %d bot response to our test input.  " +
                  "Will send a consolidate response.", 
                  respObj.seenBotResponses);
            debug(respObj.body);
            // We have all the bot responses we are waiting for
            // Send the new complex response to the test framework
            sendSuccess(respObj.response, 200, respObj.body);
            // Remove the response from our db of test responses to process
            self.removeResponseObj(index);
        } else {
            debug("Saw %d bot responses to our test input. " +
                  "Waiting for %d more before sending a consolidate response.", 
                  respObj.seenBotResponses, 
                  (respObj.expectedBotResponses - respObj.seenBotResponses));            
        }
        return true;
    }
}    

// Replace the original response body with an object that
// includes both the response to the original test
// framework request as well as one or more bot objects
function buildComplexResponseBody(testBody, req) {
    debug("Adding the bot request to the consolidated response for a test case:");
    return {
        'testFrameworkResponse': testBody,
        'botResponses': [{
            'method': req.method,
            'route': req.url,
            'body': req.body
        }]
    }
}

// Add another bot Response to the existing complexResponseBody
// includes both the response to the original test
// framework request as well as one or more bot objects
function addToComplexResponseBody(testBody, req) {
    debug("Adding the bot request to the consolidated response for a test case:");
    testBody.botResponses.push({
        'method': req.method,
        'route': req.url,
        'body': req.body    
    });
    return (testBody);
}

module.exports = ResponseStorage;