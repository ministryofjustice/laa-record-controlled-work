import { globSync, readFileSync, writeFileSync } from "node:fs";

const files = [
  ...globSync("orval/mocks/**/*.gen.ts"),
  ...globSync("src/api/clients/**/schema/**/*.gen.ts"),
];

const SCHEMA_ALIAS_IMPORT = /(#[/]api[/]clients[/][^'"\n]+?\.zod)(?=['"])/g;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const fixed = content.replaceAll(SCHEMA_ALIAS_IMPORT, "$1.gen.js");
  if (fixed !== content) {
    writeFileSync(file, fixed);
  }
}
