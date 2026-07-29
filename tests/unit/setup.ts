process.env.SESSION_SECRET ??= "test-secret";
process.env.NODE_ENV ??= "test";
process.env.ENTRA_CLIENT_ID ??= "test-client-id";
process.env.ENTRA_TENANT_ID ??= "test-tenant-id";
process.env.ENTRA_CLIENT_SECRET ??= "test-client-secret";
process.env.ENTRA_REDIRECT_URI ??= "http://localhost/auth/callback";
process.env.ENTRA_AUTHORITY_BASE_URL ??= "https://login.microsoftonline.com/";
process.env.PDA_API_KEY ??= "test-pda-api-key";
// CI exports REDIS_ENABLED=true, but unit tests should not depend on live Redis.
process.env.REDIS_ENABLED = "false";
// Configure Axios to ignore proxies
// SLSA uses safe-chain which proxies package managers
// and sets HTTPS_PROXY on the environment, which breaks
// tests.
process.env.NO_PROXY ??= "*";
