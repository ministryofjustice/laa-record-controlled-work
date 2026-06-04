import createApp from "#/app.js";
import config from "#/config.js";
import { logger } from "#/logger.js";

const app = await createApp();

app.listen(config.app.port, () => {
  logger.info(`Service: ${config.app.service.name}`);
  logger.info(`Server is running at: http://localhost:${config.app.port}`);
  logger.info(`Listening on port ${config.app.port}...`);
});
