import { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";
import { createClient, type RedisClientType } from "redis";
import { SessionConfig } from "#types/config-types.js";

export default class SessionManager {
  clientFactory: (options: object) => RedisClientType;
  redisStoreFactory:
    | ((sessionConfig: SessionConfig) => Promise<RedisStore>)
    | undefined;

  constructor() {
    this.clientFactory = createClient;
  }

  public setClientFactory(
    clientFactory: (options: object) => RedisClientType,
  ): void {
    this.clientFactory = clientFactory;
  }

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