'use strict';

const assert = require('assert');
const when = require('when');
const Spark = require('node-sparky');
const validator = require('node-sparky/validator');


const endpoint = process.env.SPARK_ENDPOINT || "http://localhost:3210"
const userToken = process.env.SPARK_TOKEN || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const botToken = process.env.BOT_TOKEN || "ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210"
let spark = new Spark({ token: userToken });
spark.apiUrl = endpoint + "/"; // node-sparky requires a "/" to compose the Resource path


// describe('#Spark.webhooksGet()', function () {
//   it('returns an array of spark webhook objects', function () {
//     return spark.webhooksGet()
//       .then(function (webhooks) {
//         return when(assert(validator.isWebhooks(webhooks), 'invalid response'));
//       });
//   });
// });


