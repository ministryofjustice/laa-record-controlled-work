export const RESERVE_SCRIPT = `
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local expiresAt = now + tonumber(ARGV[2])
local record = cjson.encode({
  reservationId = ARGV[1],
  expiresAt = expiresAt,
  status = "pending"
})
redis.call("SET", KEYS[1], record, "PXAT", expiresAt)
return tostring(expiresAt)
`;

export const PUBLISH_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return 0 end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.reservationId ~= ARGV[1] or record.status ~= "pending" then return 0 end
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if now >= tonumber(record.expiresAt) then
  redis.call("DEL", KEYS[1])
  return 0
end
record.status = "ready"
record.authState = ARGV[2]
record.authCodeRequest = cjson.decode(ARGV[3])
record.returnTo = ARGV[4]
redis.call("SET", KEYS[1], cjson.encode(record), "PXAT", record.expiresAt)
return 1
`;

export const AUTHORIZE_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return 0 end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.reservationId ~= ARGV[1] or record.status ~= "ready" then return 0 end
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if now >= tonumber(record.expiresAt) then
  redis.call("DEL", KEYS[1])
  return 0
end
return 1
`;

export const CONSUME_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return false end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.status ~= "ready" or record.authState ~= ARGV[1] then return false end
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if now >= tonumber(record.expiresAt) then
  redis.call("DEL", KEYS[1])
  return false
end
redis.call("DEL", KEYS[1])
return recordText
`;

export const ABANDON_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return 0 end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.reservationId ~= ARGV[1] then return 0 end
redis.call("DEL", KEYS[1])
return 1
`;
