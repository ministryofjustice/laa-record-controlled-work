import { signInWithMultiOffice } from "#tests/e2e/flows/auth.flow.js";
import { completeCreateCaseShortestPath } from "#tests/e2e/flows/create-case.flow.js";
import { selectOfficeByCode } from "#tests/e2e/flows/office.flow.js";
import { test } from "#tests/e2e/playwright.harness.js";

test("@e2e @zap captures the complete create-case journey", async ({ page }) => {
  await signInWithMultiOffice(page, ["R1XEVG", "VGHVEY"]);
  await selectOfficeByCode(page, "R1XEVG");
  await completeCreateCaseShortestPath(page);
});