var chakram = require('chakram'), expect = chakram.expect;

const endpoint = process.env.ENDPOINT || "http://localhost:3210";

describe("Emulator Healthcheck", function () {
    describe("ping", function () {
        it("should respond 200", function () {
            var response = chakram.get(endpoint + "/");
            return expect(response).to.have.status(200);
        })
    })
})
