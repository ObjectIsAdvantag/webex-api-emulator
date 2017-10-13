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


let personMemberships;

describe('#Spark.membershipsGet()', function () {
  it('returns an array of spark membership objects', function () {
    return spark.membershipsGet()
      .then(function (memberships) {
        personMemberships = memberships;
        return when(assert(validator.isMemberships(memberships), 'invalid response'));
      });
  });
});

describe('#Spark.membershipGet(membershipId)', function () {
  it('returns a spark membership object', function () {
    // skip membershipGet if personMemberships is not defined
    if (!(personMemberships instanceof Array && personMemberships.length > 0)) {
      this.skip();
    } else {
      return spark.membershipGet(personMemberships[0].id)
        .then(function (membership) {
          return when(assert(validator.isMembership(membership), 'invalid response'));
        });
    }
  });
});

