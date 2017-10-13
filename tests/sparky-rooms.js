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

let newRoom;
let personRooms;

describe('#Spark.roomsGet()', function () {
  it('returns an array of spark room objects', function () {
    return spark.roomsGet()
      .then(function (rooms) {
        personRooms = rooms;
        return when(assert(validator.isRooms(rooms), 'invalid response'));
      });
  });
});

describe('#Spark.roomsGet({type: "direct"})', function () {
  it('returns an array of spark room objects', function () {
    return spark.roomsGet({ type: 'direct' })
      .then(function (rooms) {
        return when(assert(validator.isRooms(rooms), 'invalid response'));
      });
  });
});

describe('#Spark.roomsGet({type: "group"})', function () {
  it('returns an array of spark room objects', function () {
    return spark.roomsGet({ type: 'group' })
      .then(function (rooms) {
        return when(assert(validator.isRooms(rooms), 'invalid response'));
      });
  });
});

describe('#Spark.roomGet(roomId)', function () {
  it('returns a spark room object', function () {
    // skip roomGet if personRooms is not defined
    if (!(personRooms instanceof Array && personRooms.length > 0)) {
      this.skip();
    } else {
      return spark.roomGet(personRooms[0].id)
        .then(function (room) {
          return when(assert(validator.isRoom(room), 'invalid response'));
        });
    }
  });
});

describe('#Spark.roomAdd()', function () {
  it('returns a spark room object', function () {
    return spark.roomAdd('! node-sparky roomAdd() test :: (safe to delete)')
      .then(function (room) {
        newRoom = validator.isRoom(room) ? room : false;
        return when(assert(validator.isRoom(room), 'invalid response'));
      });
  });
});

// describe('#Spark.roomUpdate()', function () {
//   it('returns a spark room object', function () {
//     // skip roomUpdate if newRoomId is not set (happens if previous test fails)
//     if (!newRoom) {
//       this.skip();
//     } else {
//       newRoom.title = '! node-sparky roomUpdate() test :: (safe to delete)';
//       return spark.roomUpdate(newRoom)
//         .then(function (room) {
//           return when(assert((validator.isRoom(room) && newRoom.title == room.title), 'invalid response'));
//         });
//     }
//   });
// });

// describe('#Spark.roomRemove()', function () {
//   it('returns a successful response', function () {
//     // skip roomRemove if newRoomId is not set (happens if previous test fails)
//     if (!newRoom) {
//       this.skip();
//     } else {
//       return spark.roomRemove(newRoom.id)
//         .then(function (ok) {
//           return when(assert(ok, 'invalid response'));
//         });
//     }
//   });
// });
