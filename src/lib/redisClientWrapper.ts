import type { ICacheClient } from "@azure/msal-node";
import type { RedisClientType } from "redis";

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const MAX_MEMORY = "4000mb";
const EVICTION_POLICY = "volatile-lru"; // TODO what is this?
const EMPTY_STRING = "";

/**
 *
 */
class RedisClientWrapper implements ICacheClient {
  cacheClient: RedisClientType;

  /**
   *
   * @param cacheClient
   */
  constructor(cacheClient: RedisClientType) {
    this.cacheClient = cacheClient;

    this.cacheClient.configSet("maxmemory", MAX_MEMORY);
    this.cacheClient.configSet("maxmemory-policy", EVICTION_POLICY);
  }

  /**
   * Get the data from cache given partition key
   * @param key cache partition key
   * @returns
   */
  public async get(key: string): Promise<string> {
    try {
      return (await this.cacheClient.get(key)) || EMPTY_STRING;
    } catch (error) {
      console.error(error);
    }

    return EMPTY_STRING;
  }

  /**
   * Set the data in cache given partition key and value
   * @param key cache partition key
   * @param value value to be set in cache
   * @returns
   */
  public async set(key: string, value: string): Promise<string> {
    try {
      return (
        (await this.cacheClient.set(key, value, {
          EX: CACHE_TTL, // Expire in 24 hours
        })) || EMPTY_STRING
      );
    } catch (error) {
      console.error(error);
    }

    return EMPTY_STRING;
  }
}

export default RedisClientWrapper;
