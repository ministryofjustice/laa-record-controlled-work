import config from "#/config.js";
import createApp from "#/app.js";
import chalk from "chalk";
import { displayAsciiBanner } from "#/lib/displayAsciiBanner.js";

const app = await createApp();

displayAsciiBanner(config);

app.listen(config.app.port, () => {
  console.log(chalk.yellow(`Listening on port ${config.app.port}...`));
});
