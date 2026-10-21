import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const actionDirectory = dirname(fileURLToPath(import.meta.url));
const actionPath = join(actionDirectory, "action.yml");
const orgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectId = "11111111-1111-4111-8111-111111111111";

function loadAction() {
  assert.ok(
    existsSync(actionPath),
    "The public Snyk delta composite action is missing",
  );
  const json = execFileSync(
    "ruby",
    [
      "-e",
      'require "yaml"; require "json"; puts JSON.generate(YAML.safe_load_file(ARGV.fetch(0)))',
      actionPath,
    ],
    { encoding: "utf8" },
  );
  return JSON.parse(json);
}

function makeExecutable(path, content) {
  writeFileSync(path, content, { mode: 0o755 });
}

function resolveExpression(value, inputs, outcomes, outputs) {
  return String(value).replace(
    /\$\{\{\s*([^}]+?)\s*\}\}/g,
    (_match, expression) => {
      const input = expression.match(/^inputs\.(.+)$/);
      if (input) return inputs[input[1]] ?? "";
      const step = expression.match(/^steps\.([\w-]+)\.outcome$/);
      if (step) return outcomes[step[1]] ?? "success";
      const output = expression.match(/^steps\.([\w-]+)\.outputs\.([\w-]+)$/);
      if (output) return outputs[output[1]]?.[output[2]] ?? "";
      return "";
    },
  );
}

function runAction({
  clean = true,
  deltaCodes = "0",
  failedExternalActions = [],
  inputs: inputOverrides = {},
  ossExit = 0,
  ossOutput,
} = {}) {
  const action = loadAction();
  const directory = mkdtempSync(join(tmpdir(), "snyk-delta-action-"));
  const bin = join(directory, "bin");
  const tracePath = join(directory, "commands");
  const deltaCountPath = join(directory, "delta-count");
  const outcomes = {};
  const outputs = {};
  const diagnostics = [];
  const inputs = Object.fromEntries(
    Object.entries(action.inputs ?? {}).map(([name, definition]) => [
      name,
      definition.default ?? "",
    ]),
  );
  Object.assign(
    inputs,
    {
      "open-source-project-id": projectId,
      "org-id": orgId,
      "snyk-client-id": "client-id",
      "snyk-client-secret": "client-secret",
    },
    inputOverrides,
  );
  const scanVulnerability = !clean;
  const ossResult = {
    packageManager: "npm",
    projectName: "rcw",
    severityThreshold: "high",
    vulnerabilities: scanVulnerability
      ? [
          {
            from: ["rcw@1.0.0", "example-package@1.0.0"],
            id: "SNYK-EXAMPLE-OSS",
            package: "example-package",
            severity: "high",
            version: "1.0.0",
          },
        ]
      : [],
  };
  writeFileSync(
    join(directory, "oss.json"),
    ossOutput ?? JSON.stringify(ossResult),
  );
  writeFileSync(tracePath, "");
  writeFileSync(deltaCountPath, "0");
  mkdirSync(bin, { recursive: true });
  const shell = `#!/bin/bash
set -eu
printf '%s\\n' "snyk $*" >> "$COMMAND_TRACE"
if [[ "\${1:-}" == "version" ]]; then printf '%s\\n' '1.1308.0'; exit 0; fi
if [[ "\${1:-}" == "test" ]]; then
  for argument in "$@"; do [[ "$argument" == --json-file-output=* ]] && output=\${argument#*=}; done
  cp "$OSS_RESULT" "$output"
  exit "$OSS_EXIT"
fi
exit 2
`;
  const delta = `#!/bin/bash
set -eu
if [[ "\${1:-}" == "--version" ]]; then printf '%s\\n' '1.14.0'; exit 0; fi
printf '%s\\n' "delta $*" >> "$COMMAND_TRACE"
cat >/dev/null
count=$(($(cat "$DELTA_COUNT") + 1))
printf '%s' "$count" > "$DELTA_COUNT"
exit_code=$(printf '%s' "$DELTA_CODES" | awk -F, -v index="$count" '{ print $index }')
exit "\${exit_code:-0}"
`;
  makeExecutable(join(bin, "snyk"), shell);
  makeExecutable(join(bin, "snyk-delta"), delta);
  makeExecutable(join(bin, "npm"), "#!/bin/bash\nexit 0\n");
  try {
    const steps = action.runs.steps;
    let stopped = false;

    for (const [index, step] of steps.entries()) {
      const stepId = step.id ?? `step-${index}`;
      if (stopped || !shouldRun(step.if, outcomes)) {
        outcomes[stepId] = "skipped";
        continue;
      }
      if (!step.run) {
        const actionName = step.uses?.split("@")[0];
        outcomes[stepId] = failedExternalActions.includes(actionName)
          ? "failure"
          : "success";
        diagnostics.push(
          `${stepId}: ${outcomes[stepId]} (external action stubbed)`,
        );
        if (
          outcomes[stepId] === "success" &&
          step.with?.client_id !== undefined &&
          step.with?.client_secret !== undefined
        ) {
          outputs[stepId] = { token: "test-oauth-token" };
        }
        continue;
      }
      const stepOutputPath = join(directory, `output-${stepId}`);
      writeFileSync(stepOutputPath, "");
      const env = { ...process.env };
      for (const [name, value] of Object.entries(step.env ?? {})) {
        env[name] = resolveExpression(value, inputs, outcomes, outputs);
      }
      Object.assign(env, {
        COMMAND_TRACE: tracePath,
        DELTA_CODES: deltaCodes,
        DELTA_COUNT: deltaCountPath,
        GITHUB_OUTPUT: stepOutputPath,
        OSS_EXIT: String(ossExit),
        OSS_RESULT: join(directory, "oss.json"),
        PATH: `${bin}:${process.env.PATH}`,
        TEST_TEMP_DIRECTORY: directory,
      });
      const result = spawnSync(
        "/bin/bash",
        ["-e", "-o", "pipefail", "-c", step.run],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          env,
        },
      );
      outcomes[stepId] = result.status === 0 ? "success" : "failure";
      diagnostics.push(
        `${stepId}: ${outcomes[stepId]}\n${result.stdout}${result.stderr}`,
      );
      for (const line of readFileSync(stepOutputPath, "utf8").split("\n")) {
        const separator = line.indexOf("=");
        if (separator > 0)
          (outputs[stepId] ??= {})[line.slice(0, separator)] = line.slice(
            separator + 1,
          );
      }
      if (result.status !== 0 && !step["continue-on-error"]) stopped = true;
      if (result.error) throw result.error;
    }

    const outputExpression = action.outputs?.outcome?.value;
    const outputValue = outputExpression?.match(
      /steps\.([\w-]+)\.outputs\.([\w-]+)/,
    );
    return {
      commands: readFileSync(tracePath, "utf8"),
      deltaCalls: Number(readFileSync(deltaCountPath, "utf8")),
      diagnostics: diagnostics.join("\n"),
      directory,
      outcome: outputValue
        ? outputs[outputValue[1]]?.[outputValue[2]]
        : undefined,
    };
  } catch (error) {
    rmSync(directory, { force: true, recursive: true });
    throw error;
  }
}

function shouldRun(condition, outcomes) {
  if (!condition || String(condition).includes("always()")) return true;
  const requiredSteps = [
    ...String(condition).matchAll(/steps\.([\w-]+)\.outcome\s*==\s*'success'/g),
  ];
  return requiredSteps.every(([, stepId]) => outcomes[stepId] === "success");
}

test("the public delta action accepts only Open Source inputs", () => {
  const action = loadAction();
  assert.deepEqual(Object.keys(action.inputs).sort(), [
    "open-source-project-id",
    "org-id",
    "snyk-client-id",
    "snyk-client-secret",
  ]);
});

test("Open Source delta needs no Container prerequisites or assessment", () => {
  const run = runAction();
  try {
    assert.equal(run.outcome, "passed", run.diagnostics);
    assert.equal(run.deltaCalls, 1, run.diagnostics);
    assert.match(run.commands, /snyk test/);
    assert.doesNotMatch(run.commands, /container/);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("clean scans read the explicitly configured OSS baseline", () => {
  const run = runAction();
  try {
    assert.equal(run.outcome, "passed", run.diagnostics);
    assert.equal(run.deltaCalls, 1, run.diagnostics);
    assert.match(run.commands, /--severity-threshold=high/);
    assert.equal((run.commands.match(/--policy-path=\.snyk/g) ?? []).length, 1);
    assert.match(run.commands, /--dev/);
    assert.match(run.commands, /--type vuln/);
    assert.ok(run.commands.includes(`--baselineOrg ${orgId}`));
    assert.ok(run.commands.includes(`--baselineProject ${projectId}`));
    assert.doesNotMatch(
      run.commands,
      /container|monitor|sarif|security-events/i,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("scan exit 1 passes when OSS comparison finds no regression", () => {
  const run = runAction({ clean: false, ossExit: 1 });
  try {
    assert.equal(run.outcome, "passed");
    assert.equal(run.deltaCalls, 1);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a new OSS regression fails the aggregate outcome", () => {
  const run = runAction({ deltaCodes: "1" });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 1);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a clean scan still fails when the OSS baseline cannot be read", () => {
  const run = runAction({ deltaCodes: "2" });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 1);
    assert.ok(run.commands.includes(`--baselineProject ${projectId}`));
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("OSS scan operational errors fail without running comparison", () => {
  const run = runAction({ ossExit: 2 });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("malformed Open Source vulnerability records fail closed", () => {
  const run = runAction({
    ossOutput: JSON.stringify({
      packageManager: "npm",
      projectName: "rcw",
      severityThreshold: "high",
      vulnerabilities: [
        {
          from: ["rcw@1.0.0", "example-package@1.0.0"],
          id: "SNYK-EXAMPLE-MALFORMED",
        },
      ],
    }),
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 0);
    assert.match(
      run.diagnostics,
      /Open Source scan output is missing or unsupported/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("malformed or incomplete OSS scan output fails closed", () => {
  for (const ossOutput of [
    "not-json",
    "[]",
    JSON.stringify({
      packageManager: "npm",
      severityThreshold: "high",
      vulnerabilities: [],
    }),
  ]) {
    const run = runAction({ ossOutput });
    try {
      assert.equal(run.outcome, "failed");
      assert.equal(run.deltaCalls, 0);
    } finally {
      rmSync(run.directory, { force: true, recursive: true });
    }
  }
});

test("Open Source findings require IDs and non-empty dependency paths", () => {
  const vulnerabilities = [
    {
      from: ["rcw@1.0.0", "example-package@1.0.0"],
      severity: "high",
    },
    {
      from: [],
      id: "SNYK-EXAMPLE-EMPTY-PATH",
      severity: "high",
    },
  ];
  for (const vulnerability of vulnerabilities) {
    const run = runAction({
      ossOutput: JSON.stringify({
        packageManager: "npm",
        projectName: "rcw",
        severityThreshold: "high",
        vulnerabilities: [vulnerability],
      }),
    });
    try {
      assert.equal(run.outcome, "failed");
      assert.equal(run.deltaCalls, 0);
      assert.match(
        run.diagnostics,
        /Open Source scan output is missing or unsupported/,
      );
    } finally {
      rmSync(run.directory, { force: true, recursive: true });
    }
  }
});

test("malformed organization UUIDs fail before scans", () => {
  const run = runAction({
    inputs: { "org-id": "aaaaaaaa-aaaa-4aaa-[aaa-aaaaaaaaaaaa" },
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("malformed OSS project UUIDs fail before scans", () => {
  const run = runAction({
    inputs: { "open-source-project-id": "not-a-project-id" },
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("OAuth authentication failure fails the aggregate result", () => {
  const run = runAction({
    failedExternalActions: [
      "ministryofjustice/laa-reusable-github-actions/.github/actions/snyk-auth",
    ],
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});
