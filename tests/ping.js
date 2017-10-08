var chakram = require('chakram'), expect = chakram.expect;

const endpoint = process.env.ENDPOINT || "http://localhost:3210";

describe("Chakram", function() {
    it("check API is alive", function () {
        var response = chakram.get(endpoint + "/" );
        return expect(response).to.have.status(200);
    });
});