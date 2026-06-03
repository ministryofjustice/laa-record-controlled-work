export default [
  // Disable console rule outside src; a src-specific override is defined below
  {
    name: "project/no-console-outside-src",
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/**/*"],
    rules: {
      "no-console": "off",
    },
  },
  // Restrict console usage only within src files
  {
    name: "project/src-no-console",
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "warn", // TODO: should be using a proper logger like pino or winston
    },
  },
];