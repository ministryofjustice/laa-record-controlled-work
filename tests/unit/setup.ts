process.env.SESSION_SECRET ??= "test-secret";
process.env.SESSION_NAME ??= "test-session";
process.env.NODE_ENV ??= "test";
process.env.CLIENT_ID ??= "test-client-id";
process.env.TENANT_ID ??= "test-tenant-id";
process.env.CLIENT_SECRET ??= "test-client-secret";
process.env.REDIRECT_URI ??= "test-redirect-uri";
process.env.CLOUD_INSTANCE ??= "test-cloud-instance";
process.env.POST_LOGOUT_REDIRECT_URI ??= "test-post-logout-redirect-uri";
// Configure Axios to ignore proxies
// SLSA uses safe-chain which proxies package managers
// and sets HTTPS_PROXY on the environment, which breaks
// tests.
process.env.NO_PROXY ??= "*";
