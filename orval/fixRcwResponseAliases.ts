import type {
  GeneratorImport,
  GeneratorVerbOptions,
  ResReqTypesValue,
} from "@orval/core";

const ERROR_RESPONSE_SCHEMA_NAMES = new Map([
  ["BadGatewayResponse", "InternalServerErrorResponse"],
  ["ServiceUnavailableResponse", "InternalServerErrorResponse"],
]);
const SHARED_ERROR_RESPONSE_IMPORT =
  "#/api/clients/rcw/model/internalServerErrorResponse.zod.gen.js";

/**
 * Maps gateway error types to the shared error response schema.
 * @param verb Operation response data from Orval.
 * @returns The operation using shared error-schema imports.
 */
export function mapResponseErrorsToSharedSchema(
  verb: GeneratorVerbOptions,
): GeneratorVerbOptions {
  return {
    ...verb,
    response: {
      ...verb.response,
      imports: mapErrorResponseImports(verb.response.imports),
      types: {
        ...verb.response.types,
        errors: verb.response.types.errors.map(mapErrorResponseTypeImports),
      },
    },
  };
}

/**
 * Maps gateway error imports to the shared generated error schema.
 * @param imports Response imports to map.
 * @returns Response imports with shared error schemas.
 */
function mapErrorResponseImports(
  imports: GeneratorImport[],
): GeneratorImport[] {
  const canonical = imports.map((entry) => {
    const name = ERROR_RESPONSE_SCHEMA_NAMES.get(entry.name);
    if (!name) return entry;

    return {
      ...entry,
      alias: entry.name,
      importPath: SHARED_ERROR_RESPONSE_IMPORT,
      name,
    };
  });

  return canonical.filter(
    (entry, index) =>
      canonical.findIndex(
        (candidate) =>
          candidate.name === entry.name &&
          candidate.importPath === entry.importPath &&
          candidate.alias === entry.alias,
      ) === index,
  );
}

/**
 * Maps error imports used by one response type.
 * @param type Response type metadata to map.
 * @returns The response type with the shared error schema.
 */
function mapErrorResponseTypeImports(type: ResReqTypesValue): ResReqTypesValue {
  return {
    ...type,
    imports: mapErrorResponseImports(type.imports),
  };
}
