//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//

const assert = require("assert");

var utils = {};

/*
 * Transmits an error with the Webex format    
 * {
 *     "message": "Content type 'application/xml' not supported",
 *     "errors": [
 *         {
 *             "description": "Content type 'application/xml' not supported"
 *         }
 *     ],
 *     "trackingId": "NA_982ba0e9-a1a7-4eff-9be5-c6e5cdf94d73"
 * }
 */
utils.sendError = function (res, statusCode, message, error) {
    assert.ok((res), "no response specified");
    assert.ok((statusCode), "no statusCode specified");

    if (!message) {
        _send(res, statusCode);
        return;
    }

    if (!error) {
        _send(res, statusCode, {
            "message": message,
            "errors": [
                {
                    "description": message
                }
            ],
            "trackingId": res.locals.trackingId
        });
        return;
    }

    switch (typeof error) {
        case "string":
            _send(res, statusCode, {
                "message": message,
                "errors": [
                    {
                        "description": error
                    }
                ],
                "trackingId": res.locals.trackingId
            });
            return;

        case "array":
            _send(res, statusCode, {
                "message": message,
                "errors": error,
                "trackingId": res.locals.trackingId
            });
            return;

    }

    // Should not happen
    debug("implementation issue 'Should not happen' in sendError");
    sendError(res, 501, "[Emulator] implementation issue 'Should not happen' in sendError");
}


utils.sendSuccess = function (res, statusCode, body) {
    assert.ok((res), "no response specified");

    _send(res, statusCode, body);
}

// Send as new buffer to override express auto setting of Content-Type header
// We set this manually since Webex does not include a space, and utf-8 is uppercased 
// "Content-type": "application/json;charset=UTF-8"
//
// See this as an enhancement to Express default: res.status(statusCode).send(body);
//
function _send(res, statusCode, body) {

    if (!statusCode) {
        res.status(200).send();
        return;
    }

    if (!body) {
        res.status(statusCode).send();
        return;
    }

    res.setHeader("Content-Type", "application/json;charset=UTF-8");
    res.status(statusCode).send(Buffer.from(JSON.stringify(body)));
}


module.exports = utils;