import {
  MS_IN_A_MINUTE,
  MS_IN_TWELVE_HOURS,
} from "#src/constants/timeEnums.js";

export const getSessionConfigTestCases = [
  {
    testName:
      "should return an in-memory session store when no redis_url is present",
    envConfig: {
      secret: "test-secret-1",
      name: "session-name-1",
      resave: true,
      saveUninitialized: true,
      maxAge: MS_IN_A_MINUTE,
    },
    expected: {
      secret: "test-secret-1",
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: MS_IN_A_MINUTE,
      },
    },
  },
  {
    testName:
      "should configure the session according to the environment config passed in to an in-memory store",
    envConfig: {
      secret: "test-secret-2",
      name: "session-name-2",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      redis_url: "",
    },
    expected: {
      secret: "test-secret-2",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: MS_IN_TWELVE_HOURS,
      },
    },
  },
  {
    testName:
      "should return a redis backed session store when the redis_url is present",
    envConfig: {
      secret: "test-secret-3",
      name: "session-name-3",
      resave: false,
      saveUninitialized: false,
      maxAge: MS_IN_TWELVE_HOURS,
      redis_url: "redis://redis:6379",
    },
    expected: {
      store: {},
      secret: "test-secret-3",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: MS_IN_TWELVE_HOURS,
      },
    },
  },
  {
    testName:
      "should return redis backed session store when the redis_url is present and configured according to the environment config passed in",
    envConfig: {
      secret: "test-secret-4",
      name: "session-name-4",
      resave: true,
      saveUninitialized: true,
      maxAge: MS_IN_A_MINUTE,
      redis_url: "redis://redis:6379",
    },
    expected: {
      store: {},
      secret: "test-secret-4",
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: MS_IN_A_MINUTE,
      },
    },
  },
];
