process.env.SESSION_SECRET ??= "test-secret";
process.env.SESSION_NAME ??= "test-session";

// Configure Axios to ignore proxies
// SLSA uses safe-chain which proxies package managers
// and sets HTTPS_PROXY on the environment, which breaks
// tests.
process.env.NO_PROXY ??= '*';
