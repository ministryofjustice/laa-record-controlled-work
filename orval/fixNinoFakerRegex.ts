import { globSync, readFileSync, writeFileSync } from "node:fs";

// Faker's regex generator does not support lookaheads or groups. Use a known
// valid fake prefix while keeping the API schema's stricter regex intact.
const generatedNinoRegex =
  "^(?!BG|GB|KN|NK|NT|TN|ZZ)(?![DFIQUV])[A-Z](?![DFIQUVO])[A-Z][0-9]{6}[ABCD]$";
const unsupportedFakerNinoRegex =
  "(?:[ACEHJMOPRSWY][A-CEGHJ-NPR-TW-Z]|B[A-CEHJ-NPR-TW-Z]|G[ACEGHJ-NPR-TW-Z]|K[A-CEGHJ-MPR-TW-Z]|N[A-BCEGHJ-LNPR-SW-Z]|T[A-CEGHJ-MPR-TW-Z]|Z[A-CEGHJ-NPR-TW-Y])[0-9]{6}[A-D]";
const fakerNinoRegex = "QQ[0-9]{6}[A-D]";

const files = globSync("orval/mocks/rcw/fakers/**/*.gen.ts");

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const fixed = content
    .replaceAll(`"${generatedNinoRegex}"`, `"${fakerNinoRegex}"`)
    .replaceAll(`"${unsupportedFakerNinoRegex}"`, `"${fakerNinoRegex}"`);
  if (fixed !== content) {
    writeFileSync(file, fixed);
  }
}
