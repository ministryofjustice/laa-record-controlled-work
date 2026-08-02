import type { OpenApiDocument } from "@orval/core";
import type { OpenAPIV3_1 } from "@scalar/openapi-types";

type OpenApiComponentSchemas = NonNullable<
  NonNullable<OpenApiDocument["components"]>["schemas"]
>;

interface SchemaFields {
  items?: OpenAPIV3_1.ArraySchemaObject["items"];
  properties?: OpenAPIV3_1.BaseSchemaObject["properties"];
  required?: OpenAPIV3_1.BaseSchemaObject["required"];
  type?: string | string[];
}

type SchemaOrRef = OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;
const TARGET_ENDPOINT_PATH = "/provider-firms/{firmId}/provider-offices";

/**
 * Transforms a PDA OpenAPI spec, scoping it to a single path and making all
 * optional properties in component schemas also nullable. This handles the
 * PDA API returning `null` for absent optional fields rather than omitting
 * them.
 * @param spec - The full OpenAPI document to transform.
 * @returns The transformed OpenAPI document.
 */
export function pdaTransformer(spec: OpenApiDocument): OpenApiDocument {
  const scopedPaths = getScopedPath(spec, TARGET_ENDPOINT_PATH);
  const transformedSchemas = transformComponentSchemas(spec);

  return {
    ...spec,
    components: transformedSchemas
      ? { ...spec.components, schemas: transformedSchemas }
      : spec.components,
    paths: scopedPaths,
  };
}

/**
 * Sets `nullable: true` on a schema node (OpenAPI 3.0 style), unless it is a
 * `$ref`. Includes a defensive runtime guard for boolean schemas. This uses
 * OpenAPI 3.0-style `nullable` to match observed PDA payload behaviour.
 * @param schema - The schema to make nullable.
 * @returns The schema with `nullable: true` set, or the original if a $ref/boolean.
 */
function addNullableFlag(schema: SchemaOrRef): SchemaOrRef {
  if (typeof schema === "boolean" || "$ref" in schema) return schema;
  return { ...schema, nullable: true };
}

/**
 * Returns only the requested path entry from the OpenAPI document.
 * If the target path does not exist, returns an empty paths object.
 * @param spec - The full OpenAPI document.
 * @param targetPath - The path key to keep in the transformed spec.
 * @returns A paths object containing only the target path (if found).
 */
function getScopedPath(
  spec: OpenApiDocument,
  targetPath: string,
): OpenApiDocument["paths"] {
  const pathItem = spec.paths?.[targetPath];
  return pathItem ? { [targetPath]: pathItem } : {};
}

/**
 * Applies nullable-optional-property normalisation to all component schemas.
 * @param spec - The full OpenAPI document.
 * @returns Transformed component schemas, or undefined when `components.schemas`
 * is absent.
 */
function transformComponentSchemas(
  spec: OpenApiDocument,
): OpenApiComponentSchemas | undefined {
  const schemas = spec.components?.schemas;
  if (!schemas) return undefined;

  return Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [
      name,
      transformOptionalPropsToNullable(schema),
    ]),
  );
}

/**
 * Processes an object schema's properties, making optional ones nullable.
 * Optional here means keys that are not listed in the schema's `required` array.
 * @param schema - A schema node known to have object-like properties.
 * @returns The updated schema with nullable optional properties.
 */
function transformObjectProperties(schema: SchemaOrRef): SchemaOrRef {
  if (typeof schema === "boolean" || "$ref" in schema) return schema;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SchemaFields is a typed view of known fields; AnyOtherAttribute's index signature makes the cast appear wider
  const { properties, required } = schema as SchemaFields;
  const requiredSet = new Set(required ?? []);
  const updatedProperties: Record<string, SchemaOrRef> = {};

  for (const [key, prop] of Object.entries(properties ?? {})) {
    const transformed = transformOptionalPropsToNullable(prop);
    updatedProperties[key] = requiredSet.has(key)
      ? transformed
      : addNullableFlag(transformed);
  }

  return { ...schema, properties: updatedProperties };
}

/**
 * Recursively makes all optional properties of a schema node also nullable.
 * Handles nested object schemas and array item schemas.
 * @param schema - The schema node to process.
 * @returns The schema with optional properties marked as nullable.
 */
function transformOptionalPropsToNullable(schema: SchemaOrRef): SchemaOrRef {
  if (typeof schema === "boolean" || "$ref" in schema) return schema;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SchemaFields is a typed view of known fields; AnyOtherAttribute's index signature makes the cast appear wider
  const { items, properties, type } = schema as SchemaFields;

  if (type === "object" || properties !== undefined) {
    return transformObjectProperties(schema);
  }

  if (type === "array" && items !== undefined) {
    return { ...schema, items: transformOptionalPropsToNullable(items) };
  }

  return schema;
}
