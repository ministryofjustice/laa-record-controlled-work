import { spawnSync } from "node:child_process";

import { expect } from "chai";
import type { ZodType } from "zod";

import { z } from "zod";

type FormatSample = {
  name: string;
  value: string;
  schema: () => ZodType;
  schemaExpression: string;
};

const formatSamples: FormatSample[] = [
  {
    name: "url",
    value: "https://example.com/path?query=1",
    schema: () => z.url(),
    schemaExpression: "z.url()",
  },
  {
    name: "email",
    value: "name@example.com",
    schema: () => z.email(),
    schemaExpression: "z.email()",
  },
  {
    name: "guid",
    value: "6F9619FF-8B86-D011-B42D-00C04FC964FF",
    schema: () => z.guid(),
    schemaExpression: "z.guid()",
  },
  {
    name: "uuid",
    value: "550e8400-e29b-41d4-a716-446655440000",
    schema: () => z.uuid(),
    schemaExpression: "z.uuid()",
  },
  {
    name: "cuid",
    value: "cjld2cjxh0000qzrmn831i7rn",
    schema: () => z.cuid(),
    schemaExpression: "z.cuid()",
  },
  {
    name: "cuid2",
    value: "tz4a98xxat96iws9zmbrgj3a",
    schema: () => z.cuid2(),
    schemaExpression: "z.cuid2()",
  },
  {
    name: "ulid",
    value: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    schema: () => z.ulid(),
    schemaExpression: "z.ulid()",
  },
  {
    name: "nanoid",
    value: "V1StGXR8_Z5jdHi6B-myT",
    schema: () => z.nanoid(),
    schemaExpression: "z.nanoid()",
  },
  {
    name: "xid",
    value: "9m4e2mr0ui3e8a215n4g",
    schema: () => z.xid(),
    schemaExpression: "z.xid()",
  },
  {
    name: "ksuid",
    value: "0ujsswThIGTUYm2K8FjOOfXtY1K",
    schema: () => z.ksuid(),
    schemaExpression: "z.ksuid()",
  },
  {
    name: "jwt",
    value:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    schema: () => z.jwt(),
    schemaExpression: "z.jwt()",
  },
  {
    name: "emoji",
    value: "😀",
    schema: () => z.emoji(),
    schemaExpression: "z.emoji()",
  },
  {
    name: "ipv4",
    value: "192.168.0.1",
    schema: () => z.ipv4(),
    schemaExpression: "z.ipv4()",
  },
  {
    name: "ipv6",
    value: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    schema: () => z.ipv6(),
    schemaExpression: "z.ipv6()",
  },
  {
    name: "cidrv4",
    value: "192.168.0.0/24",
    schema: () => z.cidrv4(),
    schemaExpression: "z.cidrv4()",
  },
  {
    name: "cidrv6",
    value: "2001:db8::/32",
    schema: () => z.cidrv6(),
    schemaExpression: "z.cidrv6()",
  },
  {
    name: "e164",
    value: "+447911123456",
    schema: () => z.e164(),
    schemaExpression: "z.e164()",
  },
  {
    name: "base64",
    value: "Zm9vYmFy",
    schema: () => z.base64(),
    schemaExpression: "z.base64()",
  },
  {
    name: "base64url",
    value: "Zm9vLWJhcg",
    schema: () => z.base64url(),
    schemaExpression: "z.base64url()",
  },
  {
    name: "date",
    value: "2024-01-31",
    schema: () => z.iso.date(),
    schemaExpression: "z.iso.date()",
  },
  {
    name: "time",
    value: "23:59:59",
    schema: () => z.iso.time(),
    schemaExpression: "z.iso.time()",
  },
  {
    name: "datetime",
    value: "2024-01-31T23:59:59.000Z",
    schema: () => z.iso.datetime(),
    schemaExpression: "z.iso.datetime()",
  },
  {
    name: "duration",
    value: "PT1H",
    schema: () => z.iso.duration(),
    schemaExpression: "z.iso.duration()",
  },
];

describe("Zod optional extension", () => {
  it("fails if upstream optional already accepts empty formatted strings", () => {
    const upstreamAcceptsEmpty = ["base64", "base64url"] as const;
    const script = [
      "import { z } from 'zod';",
      `const allowed = new Set(${JSON.stringify(upstreamAcceptsEmpty)});`,
      "const formats = [",
      ...formatSamples.map(
        (sample) => `['${sample.name}', () => ${sample.schemaExpression}],`,
      ),
      "];",
      "for (const [name, factory] of formats) {",
      "  if (allowed.has(name)) continue;",
      "  const result = factory().optional().safeParse('');",
      "  if (result.success) process.exit(1);",
      "}",
    ].join(" ");

    const run = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(run.status).to.equal(
      0,
      `Expected upstream optional to reject empty strings. ${run.stderr ?? ""}`,
    );
  });

  for (const sample of formatSamples) {
    it(`validates ${sample.name} format and optional behavior`, () => {
      const schema = sample.schema();
      const result = schema.safeParse(sample.value);

      expect(result.success).to.equal(true);
      if (result.success) {
        expect(result.data).to.equal(sample.value);
      }

      const optionalResult = schema.optional().safeParse("");

      expect(optionalResult.success).to.equal(true);
      if (optionalResult.success) {
        expect(optionalResult.data).to.equal(undefined);
      }

      const optionalValid = schema.optional().safeParse(sample.value);

      expect(optionalValid.success).to.equal(true);
      if (optionalValid.success) {
        expect(optionalValid.data).to.equal(sample.value);
      }
    });
  }

  it("does not alter non-formatted optionals", () => {
    const result = z.string().optional().safeParse("");

    expect(result.success).to.equal(true);
    if (result.success) {
      expect(result.data).to.equal("");
    }
  });
});
