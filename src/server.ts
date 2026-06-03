import createApp from "#/app.js";
import config from "#/config.js";
import { displayAsciiBanner } from "#/lib/displayAsciiBanner.js";
import { logger } from "#/logger.js";

const app = await createApp();

displayAsciiBanner(config);

app.listen(config.app.port, () => {
  logger.info(`Listening on port ${config.app.port}...`);
});
