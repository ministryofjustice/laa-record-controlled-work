import { existsSync, readFileSync, writeFileSync } from "node:fs";

const zodFilePath =
  "src/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.ts";

convertOptionalToNullish(zodFilePath);

/**
 * Replaces `.optional()` with `.nullish()` in a generated Zod file to handle
 * the PDA API returning `null` for absent optional fields.
 * @param filePath - Path to the generated Zod file.
 */
function convertOptionalToNullish(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }
  let content = readFileSync(filePath, "utf-8");
  content = content.replace(/\.optional\(\)/g, ".nullish()");
  writeFileSync(filePath, content);
}
