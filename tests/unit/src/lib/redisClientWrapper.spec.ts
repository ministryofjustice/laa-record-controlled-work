// Use a sinon stub for the Redis client — no real connection:
// 
describe("RedisClientWrapper", () => {
    describe("#get(key)", () => {
        it("returns the cached string when cacheClient.get() resolves a value", async () => {
            // TODO
        })
        it("returns empty string when cacheClient.get() resolves null", async () => {
            // TODO
        })
        it("returns empty string when cacheClient.get() rejects (and logs error)", async () => {
            // TODO
        })
    })
    describe("#set(key, value)", () => {
        it("calls cacheClient.set() with key, value, and { EX: 86400 } option", async () => {
            // TODO
        })
        it("returns the string result from cacheClient.set()", async () => {
            // TODO
        })
        it("returns empty string when cacheClient.set() rejects (and logs error)", async () => {
            // TODO
        })
    })

})