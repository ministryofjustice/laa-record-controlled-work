import type { ZodType } from "zod";

import { z } from "zod";

const EMPTY_STRING_LENGTH = 0;
const FORMAT_KIND_KEY = "kind";
const FORMAT_KEY = "format";
const CHECKS_KEY = "checks";
const PATCH_FLAG = Symbol.for("zodOptionalFormattedPatched");

const formatKinds = new Set([
  "base64",
  "base64url",
  "cidrv4",
  "cidrv6",
  "cuid",
  "cuid2",
  "date",
  "datetime",
  "duration",
  "e164",
  "email",
  "emoji",
  "guid",
  "ipv4",
  "ipv6",
  "jwt",
  "ksuid",
  "nanoid",
  "time",
  "ulid",
  "url",
  "uuid",
  "xid",
]);

type OptionalMethod = () => ZodType;
type OptionalReturn = ZodType;
const isOptionalMethod = (value: unknown): value is OptionalMethod =>
  typeof value === "function";
const isOptionalDescriptor = (
  descriptor: PropertyDescriptor | undefined,
): descriptor is {
  get: (this: unknown) => unknown;
  set: (this: unknown, value: OptionalMethod) => void;
} => {
  if (!descriptor) {
    return false;
  }

  return (
    typeof descriptor.get === "function" && typeof descriptor.set === "function"
  );
};

const isObjectLike = (value: unknown): value is Record<string, unknown> =>
  (typeof value === "object" && value !== null) || typeof value === "function";

const hasPatchFlag = (value: unknown): boolean =>
  isObjectLike(value) && PATCH_FLAG in value;

const isFormattedStringSchema = (schema: ZodType): boolean => {
  const { def } = schema;

  if (!isObjectLike(def)) {
    return false;
  }

  const formatValue = def[FORMAT_KEY];

  if (
    typeof formatValue === "string" &&
    formatValue.length > EMPTY_STRING_LENGTH
  ) {
    return true;
  }

  const checksValue = def[CHECKS_KEY];

  if (!Array.isArray(checksValue)) {
    return false;
  }

  return checksValue.some((check) => {
    if (!isObjectLike(check)) {
      return false;
    }

    const kindValue = check[FORMAT_KIND_KEY];

    return typeof kindValue === "string" && formatKinds.has(kindValue);
  });
};

const getOptionalDescriptor = (
  prototype: object,
): null | {
  get: (target: unknown) => OptionalMethod;
  set: (target: unknown, value: OptionalMethod) => void;
} => {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "optional");

  if (!isOptionalDescriptor(descriptor)) {
    return null;
  }

  return {
    get: (target: unknown) => {
      const result: unknown = descriptor.get.call(target);

      if (!isOptionalMethod(result)) {
        throw new TypeError("Expected optional getter to return a function.");
      }

      return result;
    },
    set: (target: unknown, value: OptionalMethod) => {
      descriptor.set.call(target, value);
    },
  };
};

const patchOptionalPrototype = (prototype: object): void => {
  if (hasPatchFlag(prototype)) {
    return;
  }

  const descriptor = getOptionalDescriptor(prototype);

  if (!descriptor) {
    return;
  }

  Object.defineProperty(prototype, "optional", {
    configurable: true,
    enumerable: false,
    get(this: ZodType) {
      const boundOptional = descriptor.get(this);

      if (!isFormattedStringSchema(this)) {
        return boundOptional;
      }

      const wrappedOptional = (): OptionalReturn => {
        const optionalSchema = boundOptional();

        return z.preprocess(
          (value) => (value === "" ? undefined : value),
          optionalSchema,
        );
      };

      Object.defineProperty(this, "optional", {
        configurable: true,
        enumerable: true,
        value: wrappedOptional,
        writable: true,
      });

      return wrappedOptional;
    },
    set(this: ZodType, value: OptionalMethod) {
      descriptor.set(this, value);
    },
  });

  Object.defineProperty(prototype, PATCH_FLAG, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });
};

type SchemaFactory = () => ZodType;
const isSchemaFactory = (value: unknown): value is SchemaFactory =>
  typeof value === "function";

const schemaFactories: SchemaFactory[] = [
  z.string,
  z.url,
  z.httpUrl,
  z.email,
  z.guid,
  z.uuid,
  z.uuidv4,
  z.uuidv6,
  z.uuidv7,
  z.cuid,
  z.cuid2,
  z.ulid,
  z.nanoid,
  z.xid,
  z.ksuid,
  z.emoji,
  z.jwt,
  z.base64,
  z.base64url,
  z.ipv4,
  z.ipv6,
  z.cidrv4,
  z.cidrv6,
  z.e164,
];

const isoNamespace = "iso" in z && isObjectLike(z.iso) ? z.iso : null;
const isoDate =
  isoNamespace && "date" in isoNamespace ? isoNamespace.date : null;
const isoTime =
  isoNamespace && "time" in isoNamespace ? isoNamespace.time : null;
const isoDatetime =
  isoNamespace && "datetime" in isoNamespace ? isoNamespace.datetime : null;
const isoDuration =
  isoNamespace && "duration" in isoNamespace ? isoNamespace.duration : null;

if (isSchemaFactory(isoDate)) {
  schemaFactories.push(isoDate);
}

if (isSchemaFactory(isoTime)) {
  schemaFactories.push(isoTime);
}

if (isSchemaFactory(isoDatetime)) {
  schemaFactories.push(isoDatetime);
}

if (isSchemaFactory(isoDuration)) {
  schemaFactories.push(isoDuration);
}

const optionalPrototypes = new Set<object>();

for (const factory of schemaFactories) {
  const prototype: unknown = Object.getPrototypeOf(factory());

  if (isObjectLike(prototype)) {
    optionalPrototypes.add(prototype);
  }
}

for (const prototype of optionalPrototypes) {
  patchOptionalPrototype(prototype);
}
