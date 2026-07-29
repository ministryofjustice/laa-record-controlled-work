import { spawnSync } from "node:child_process";
import { parse } from "yaml";

const EXIT_SUCCESS = 0;

export type OpenApiDocument = Record<string, unknown>;

interface GitHubSpecOptions {
  hostname?: string;
  path: string;
  ref: string;
  repository: string;
}

/**
 * Loads an OpenAPI specification from a GitHub repository using the GitHub CLI.
 * @param options Configuration options for retrieving the specification
 * @returns The parsed OpenAPI document
 */
export function loadGitHubOpenApiSpec(
  options: GitHubSpecOptions,
): OpenApiDocument {
  const endpoint =
    `repos/${options.repository}/contents/${options.path}` +
    `?ref=${encodeURIComponent(options.ref)}`;

  const args = ["api"];

  if (options.hostname) {
    args.push("--hostname", options.hostname);
  }

  args.push(endpoint, "--header", "Accept: application/vnd.github.raw+json");

  const result = spawnSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`Unable to execute GitHub CLI: ${result.error.message}`);
  }

  if (result.status !== EXIT_SUCCESS) {
    throw new Error(
      [
        "Unable to retrieve the OpenAPI specification from GitHub.",
        result.stderr.trim(),
        "Check that gh is installed, authenticated, and has repository access.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const document: unknown = parse(result.stdout);

  if (!isOpenApiDocument(document)) {
    throw new Error("The retrieved OpenAPI specification is not an object.");
  }

  return document;
}

/**
 * Type guard to validate that a value is a valid OpenAPI document.
 * @param value The value to validate
 * @returns True if the value is a plain object (not array or null)
 */
function isOpenApiDocument(value: unknown): value is OpenApiDocument {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
