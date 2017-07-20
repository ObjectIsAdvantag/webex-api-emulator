//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//

const assert = require("assert");

var utils = {};

/*
 * Transmits an error with the Cisco Spark format    
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
        res.status(statusCode).send();
        return;
    }

    if (!error) {
        res.status(statusCode).send({
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
            res.status(statusCode).send({
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
            res.status(statusCode).send({
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

    if (!statusCode) {
        res.status(200).send();
        return;
    }

    if (!body) {
        res.status(statusCode).send();
        return;
    }

    res.status(statusCode).send(body);
}


module.exports = utils;