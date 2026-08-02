import type { OpenApiDocument } from "@orval/core";
import type { OpenAPIV3_1 } from "@scalar/openapi-types";

/**
 * A typed view of the schema fields we access, derived from library types.
 * Declared separately to avoid `AnyOtherAttribute`'s `[key: string]: any`
 * index signature polluting field access with `any`.
 */
interface SchemaFields {
  items?: OpenAPIV3_1.ArraySchemaObject["items"];
  properties?: OpenAPIV3_1.BaseSchemaObject["properties"];
  required?: OpenAPIV3_1.BaseSchemaObject["required"];
  /** Spans ArraySchemaObject ("array") and NonArraySchemaObject ("object" etc.) */
  type?: string | string[];
}

type SchemaOrRef = OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;

/**
 * Transforms a PDA OpenAPI spec, scoping it to a single path and making all
 * optional schema properties also nullable. This handles the PDA API returning
 * `null` for absent optional fields rather than omitting them.
 * @param spec - The full OpenAPI document to transform.
 * @returns The transformed OpenAPI document.
 */
export function pdaTransformer(spec: OpenApiDocument): OpenApiDocument {
  const targetPath = "/provider-firms/{firmId}/provider-offices";
  const pathItem = spec.paths?.[targetPath];
  const schemas = spec.components?.schemas;

  const rawSchemas = schemas
    ? Object.fromEntries(
        Object.entries(schemas).map(([name, schema]) => [
          name,
          withNullableOptionalProperties(schema),
        ]),
      )
    : undefined;

  const processedSchemas = rawSchemas;

  return {
    ...spec,
    components: schemas
      ? { ...spec.components, schemas: processedSchemas }
      : spec.components,
    paths: pathItem ? { [targetPath]: pathItem } : {},
  };
}

/**
 * Sets `nullable: true` on a schema node (OpenAPI 3.0 style), unless it is a
 * `$ref` or boolean schema.
 * @param schema - The schema to make nullable.
 * @returns The schema with `nullable: true` set, or the original if a $ref/boolean.
 */
function makeNullable(schema: SchemaOrRef): SchemaOrRef {
  if (typeof schema === "boolean" || "$ref" in schema) return schema;
  return { ...schema, nullable: true };
}

/**
 * Processes an object schema's properties, making optional ones nullable.
 * @param schema - A schema node known to have object-like properties.
 * @returns The updated schema with nullable optional properties.
 */
function processObjectProperties(schema: SchemaOrRef): SchemaOrRef {
  if (typeof schema === "boolean" || "$ref" in schema) return schema;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SchemaFields is a typed view of known fields; AnyOtherAttribute's index signature makes the cast appear wider
  const { properties, required } = schema as SchemaFields;
  const requiredSet = new Set(required ?? []);
  const updatedProperties: Record<string, SchemaOrRef> = {};

  for (const [key, prop] of Object.entries(properties ?? {})) {
    const processed = withNullableOptionalProperties(prop);
    updatedProperties[key] = requiredSet.has(key)
      ? processed
      : makeNullable(processed);
  }

  return { ...schema, properties: updatedProperties };
}

/**
 * Recursively makes all optional properties of a schema node also nullable.
 * Handles nested object schemas and array item schemas.
 * @param schema - The schema node to process.
 * @returns The schema with optional properties marked as nullable.
 */
function withNullableOptionalProperties(schema: SchemaOrRef): SchemaOrRef {
  if (typeof schema === "boolean" || "$ref" in schema) return schema;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SchemaFields is a typed view of known fields; AnyOtherAttribute's index signature makes the cast appear wider
  const { items, properties, type } = schema as SchemaFields;

  if (type === "object" || properties !== undefined) {
    return processObjectProperties(schema);
  }

  if (type === "array" && items !== undefined) {
    return { ...schema, items: withNullableOptionalProperties(items) };
  }

  return schema;
}
