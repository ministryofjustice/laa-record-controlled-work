import type { ExpressSessionConfig } from "#types/config-types.js";
import { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";
import { createClient, type RedisClientType } from "redis";

// TODO convert this to more functional and move to bootstrap, make you inject createClient from redis, move tests to integration directory

/**
 * TODO
 */
export default class SessionService {
  clientFactory: (options: object) => RedisClientType;
  redisStoreFactory?: (
    sessionConfig: ExpressSessionConfig,
  ) => Promise<RedisStore>;

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
    redisStoreFactory: (
      sessionConfig: ExpressSessionConfig,
    ) => Promise<RedisStore>,
  ): void {
    this.redisStoreFactory = redisStoreFactory;
  }

  public getSessionConfig = async (
    envConfig: ExpressSessionConfig,
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

    if (envConfig.redisUrl) {
      const factory = this.redisStoreFactory ?? this.getRedisStore;
      const redisStore = await factory(envConfig);
      return { ...baseConfig, store: redisStore };
    }

    return baseConfig;
  };

  public getRedisStore = async (
    envConfig: ExpressSessionConfig,
  ): Promise<RedisStore> => {
    const redisClient = this.clientFactory({ url: envConfig.redisUrl });
    await redisClient.connect();
    return new RedisStore({ client: redisClient });
  };
}
