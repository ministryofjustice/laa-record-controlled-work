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
const containerFixturePath = join(
  actionDirectory,
  "fixtures",
  "container-results.json",
);
const projectId = "11111111-1111-4111-8111-111111111111";
const image = "registry.example.test/rcw@sha256:" + "a".repeat(64);
const containerProjects = [
  {
    identityType: "apk",
    projectId: "22222222-2222-4222-8222-222222222222",
    targetFile: "",
  },
  {
    identityType: "npm",
    projectId: "33333333-3333-4333-8333-333333333333",
    targetFile: "/package.json",
  },
];

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
  containerExit = 0,
  containerOutput,
  deltaCodes = "0,0,0",
  failedActions = [],
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
      "container-projects-json": JSON.stringify(containerProjects),
      dockerfile: "Dockerfile",
      "image-ref": image,
      "open-source-project-id": projectId,
      "org-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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
  const containerResults = JSON.parse(
    readFileSync(containerFixturePath, "utf8"),
  ).map((result) => ({
    ...result,
    vulnerabilities: scanVulnerability ? result.vulnerabilities : [],
  }));

  writeFileSync(
    join(directory, "oss.json"),
    ossOutput ?? JSON.stringify(ossResult),
  );
  writeFileSync(
    join(directory, "container.json"),
    containerOutput ?? JSON.stringify(containerResults),
  );
  writeFileSync(tracePath, "");
  writeFileSync(deltaCountPath, "0");
  mkdirSync(bin, { recursive: true });
  const shell = `#!/bin/bash
set -eu
printf '%s\\n' "snyk $*" >> "$COMMAND_TRACE"
if [[ "\${1:-}" == "version" ]]; then printf '%s\\n' '1.1308.0'; exit 0; fi
if [[ "\${1:-}" == "container" && "\${2:-}" == "test" ]]; then
  for argument in "$@"; do [[ "$argument" == --json-file-output=* ]] && output=\${argument#*=}; done
  cp "$CONTAINER_RESULT" "$output"
  exit "$CONTAINER_EXIT"
fi
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
        outcomes[stepId] = failedActions.includes(stepId)
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
        CONTAINER_EXIT: String(containerExit),
        CONTAINER_RESULT: join(directory, "container.json"),
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

test("clean scans still compare OSS and every configured Container result", () => {
  const run = runAction();
  try {
    assert.equal(run.outcome, "passed", run.diagnostics);
    assert.equal(run.deltaCalls, 3);
    assert.match(run.commands, /--severity-threshold=high/);
    assert.equal((run.commands.match(/--policy-path=\.snyk/g) ?? []).length, 2);
    assert.match(run.commands, /--dev/);
    assert.match(run.commands, /--type vuln/);
    for (const baselineId of [
      projectId,
      ...containerProjects.map((project) => project.projectId),
    ]) {
      assert.ok(
        run.commands.includes(`--baselineProject ${baselineId}`),
        `Missing comparison for ${baselineId}`,
      );
    }
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("scan exit 1 passes when each comparison finds no regression", () => {
  const run = runAction({ clean: false, containerExit: 1, ossExit: 1 });
  try {
    assert.equal(run.outcome, "passed");
    assert.equal(run.deltaCalls, 3);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a later Container regression fails without hiding remaining results", () => {
  const run = runAction({ deltaCodes: "0,1,0" });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 3);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a baseline comparison error fails while later results are still assessed", () => {
  const run = runAction({ deltaCodes: "2,0,0" });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 3);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("scan operational errors fail while the other product is still assessed", () => {
  const run = runAction({ ossExit: 2 });
  try {
    assert.equal(run.outcome, "failed");
    assert.match(run.commands, /snyk container test/);
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
    assert.equal(run.deltaCalls, 2);
    assert.match(
      run.diagnostics,
      /Open Source scan output is missing or unsupported/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
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
      assert.equal(run.deltaCalls, 2);
      assert.match(
        run.diagnostics,
        /Open Source scan output is missing or unsupported/,
      );
    } finally {
      rmSync(run.directory, { force: true, recursive: true });
    }
  }
});

test("missing Container mappings fail before scans, including on clean inputs", () => {
  const run = runAction({ inputs: { "container-projects-json": "[]" } });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
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

test("Container mappings cannot omit the application dependency result", () => {
  const run = runAction({
    inputs: {
      "container-projects-json": JSON.stringify([containerProjects[0]]),
    },
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a monitored project UUID cannot be reused for distinct Container results", () => {
  const mappings = containerProjects.map((project) => ({
    ...project,
    projectId: projectId,
  }));
  const run = runAction({
    inputs: { "container-projects-json": JSON.stringify(mappings) },
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("project UUID reuse differing only by hex casing fails closed", () => {
  const repeatedId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const mappings = containerProjects.map((project, index) => ({
    ...project,
    projectId: index === 0 ? repeatedId.toUpperCase() : repeatedId,
  }));
  const run = runAction({
    inputs: {
      "container-projects-json": JSON.stringify(mappings),
      "open-source-project-id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    },
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a Container project mapped to the wrong result identity fails closed", () => {
  const mappings = [
    containerProjects[0],
    { ...containerProjects[1], targetFile: "/wrong.json" },
  ];
  const run = runAction({
    inputs: { "container-projects-json": JSON.stringify(mappings) },
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 2);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("malformed Container scan output fails closed", () => {
  const run = runAction({ containerOutput: "not-json" });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 1);
    assert.match(
      run.diagnostics,
      /Container scan output is malformed or unsupported/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Container results missing project identity metadata fail closed", () => {
  const containerResults = JSON.parse(
    readFileSync(containerFixturePath, "utf8"),
  );
  delete containerResults[0].projectName;
  const run = runAction({
    containerOutput: JSON.stringify(containerResults),
  });
  try {
    assert.equal(run.outcome, "failed");
    assert.equal(run.deltaCalls, 1);
    assert.match(
      run.diagnostics,
      /Container scan output is malformed or unsupported/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Container findings require IDs and non-empty dependency paths", () => {
  for (const vulnerability of [
    { from: ["docker-image|rcw@latest"], severity: "low" },
    { from: [], id: "SNYK-EXAMPLE-EMPTY-PATH", severity: "low" },
  ]) {
    const containerResults = JSON.parse(
      readFileSync(containerFixturePath, "utf8"),
    );
    containerResults[0].vulnerabilities = [vulnerability];
    const run = runAction({
      containerOutput: JSON.stringify(containerResults),
    });
    try {
      assert.equal(run.outcome, "failed");
      assert.equal(run.deltaCalls, 1);
      assert.match(
        run.diagnostics,
        /Container scan output is malformed or unsupported/,
      );
    } finally {
      rmSync(run.directory, { force: true, recursive: true });
    }
  }
});

test("OAuth authentication failure fails the aggregate result", () => {
  const run = runAction({ failedActions: ["snyk-auth"] });
  try {
    assert.equal(run.outcome, "failed");
    assert.doesNotMatch(run.commands, /snyk test/);
    assert.equal(run.deltaCalls, 0);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});
