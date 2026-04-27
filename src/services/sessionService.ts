import type { SessionConfig } from "#types/config-types.js";
import { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";
import { createClient, type RedisClientType } from "redis";

/**
 * TODO
 */
export default class SessionService {
  clientFactory: (options: object) => RedisClientType;
  redisStoreFactory:
    | ((sessionConfig: SessionConfig) => Promise<RedisStore>)
    | undefined;

  /**
   * TODO
   */
  private constructor() {
    this.clientFactory = createClient;
  }

  /**
   * Factory method to create a new SessionService instance.
   * @returns {SessionService} A new SessionService instance.
   */
  public static create(): SessionService {
    return new SessionService();
  }

  /**
   * TODO
   * @param clientFactory - TODO
   */
  public setClientFactory(
    clientFactory: (options: object) => RedisClientType,
  ): void {
    this.clientFactory = clientFactory;
  }

  /**
   * TODO
   * @param redisStoreFactory - TODO
   */
  public setRedisStoreFactory(
    redisStoreFactory: (sessionConfig: SessionConfig) => Promise<RedisStore>,
  ): void {
    this.redisStoreFactory = redisStoreFactory;
  }

  public getSessionConfig = async (
    envConfig: SessionConfig,
  ): Promise<SessionOptions> => {
    const baseConfig = {
      secret: envConfig.secret,
      resave: envConfig.resave,
      saveUninitialized: envConfig.saveUninitialized,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: envConfig.maxAge,
      },
    };

    if (envConfig.redis_url) {
      const factory = this.redisStoreFactory ?? this.getRedisStore;
      const redisStore = await factory(envConfig);
      return { ...baseConfig, store: redisStore };
    }

    return baseConfig;
  };

  public getRedisStore = async (
    envConfig: SessionConfig,
  ): Promise<RedisStore> => {
    const redisClient = this.clientFactory({ url: envConfig.redis_url });
    await redisClient.connect();
    return new RedisStore({ client: redisClient });
  };
}
