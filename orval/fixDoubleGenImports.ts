import { globSync, readFileSync, writeFileSync } from "node:fs";

// Orval duplicates ".gen" in cross-file faker import paths when fileExtension
// is multi-part (".gen.ts"); collapse ".gen.gen." back to ".gen.".
const files = globSync("orval/mocks/**/*.gen.ts");

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const fixed = content.replaceAll(".gen.gen.", ".gen.");
  if (fixed !== content) {
    writeFileSync(file, fixed);
  }
}
