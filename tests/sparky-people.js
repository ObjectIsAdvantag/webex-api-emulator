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


describe('#Spark.personMe()', function () {
  it('returns spark person object of authenticated account', function () {
    return spark.personMe()
      .then(function (person) {
        return when(assert(validator.isPerson(person), 'invalid response'));
      });
  });
});

