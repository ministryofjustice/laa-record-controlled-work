import type { OpenApiDocument } from "@orval/core";

const TARGET_ENDPOINT_PATH = "/provider-firms/{firmId}/provider-offices";

/**
 * Scopes the PDA spec to a single endpoint path.
 * @param spec - The full OpenAPI document.
 * @returns The document with paths limited to the target endpoint.
 */
export function pdaTransformer(spec: OpenApiDocument): OpenApiDocument {
  const pathItem = spec.paths?.[TARGET_ENDPOINT_PATH];
  return {
    ...spec,
    paths: pathItem ? { [TARGET_ENDPOINT_PATH]: pathItem } : {},
  };
}
