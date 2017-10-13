var chakram = require('chakram'), expect = chakram.expect

const endpoint = process.env.SPARK_ENDPOINT || "http://localhost:3210"
const userToken = process.env.SPARK_TOKEN || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const botToken = process.env.BOT_TOKEN || "ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210"

describe("GET people me", function () {
    describe("no token", function () {
        it("should respond 401", function () {
            var response = chakram.get(endpoint + "/people/me")
            return expect(response).to.have.status(401);
        })
    })

    describe("user token", function () {
        it("should show my details", function () {
            var response = chakram.get(endpoint + "/people/me", {
                "headers": {
                    "Authorization": "Bearer " + userToken
                }
            })
            return expect(response).to.have.status(200)
        })
    })
})
