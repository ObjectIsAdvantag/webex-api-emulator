var chakram = require('chakram'), expect = chakram.expect

const endpoint = process.env.ENDPOINT || "http://localhost:3210"
const userToken = process.env.SPARK_TOKEN || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const botToken = process.env.BOT_TOKEN || "ZYXWVUTSRQPONMLKJIHGFEDCBA9876543210"

var suite = "GET people me: "
describe("Chakram", function () {
    it(suite + "no token", function () {
        var response = chakram.get(endpoint + "/" + "people/me")
        return expect(response).to.have.status(401);
    })

    it(suite + "user ok", function () {
        var response = chakram.get(endpoint + "/" + "people/me", {
            "headers": {
                "Authorization": "Bearer " + userToken
            }
        })
        return expect(response).to.have.status(200)
    })
})