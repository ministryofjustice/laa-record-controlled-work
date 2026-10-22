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
const publisherWorkflowPath = join(
  actionDirectory,
  "..",
  "..",
  "workflows",
  "snyk-monitor.yml",
);
const ciWorkflowPath = join(
  actionDirectory,
  "..",
  "..",
  "workflows",
  "cicd.yml",
);
const nightlyWorkflowPath = join(
  actionDirectory,
  "..",
  "..",
  "workflows",
  "nightly.yml",
);
const sourceSha = "0123456789012345678901234567890123456789";
const openSourceProjectId = "11111111-1111-4111-8111-111111111111";
const containerResults = [
  {
    docker: { baseImage: "alpine:3" },
    packageManager: "apk",
    projectName: "laa-record-controlled-work",
    scanResult: {
      identity: { type: "apk" },
      target: { image: "registry.example.test/rcw:main" },
    },
    vulnerabilities: [],
  },
  {
    packageManager: "npm",
    projectName: "laa-record-controlled-work",
    scanResult: {
      identity: { targetFile: "/package.json", type: "npm" },
      target: { image: "registry.example.test/rcw:main" },
    },
    vulnerabilities: [],
  },
];

const sarifOutputByCategory = {
  "snyk-code": "code-sarif-valid",
  "snyk-container": "container-sarif-valid",
  "snyk-iac-production": "iac-production-sarif-valid",
  "snyk-iac-staging": "iac-staging-sarif-valid",
  "snyk-iac-uat": "iac-uat-sarif-valid",
  "snyk-open-source": "open-source-sarif-valid",
};

function availableSarifUploads(workflow, run) {
  return workflow.jobs.publish.steps
    .filter((step) => step.uses?.includes("upload-sarif@"))
    .filter(
      (step) =>
        String(step.if).includes("always()") &&
        String(step.if).includes(
          "steps.refresh.outputs.publication-state == 'current'",
        ) &&
        String(step.if).includes(
          `steps.refresh.outputs.${sarifOutputByCategory[step.with.category]} == 'true'`,
        ) &&
        run.publicationState === "current" &&
        run.actionOutputs[sarifOutputByCategory[step.with.category]] ===
          "true" &&
        existsSync(join(run.directory, step.with.sarif_file)),
    )
    .map((step) => step.with.category);
}

function loadAction() {
  assert.ok(existsSync(actionPath), "The Snyk baseline action is missing");
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

function loadYaml(filePath) {
  const json = execFileSync(
    "ruby",
    [
      "-e",
      'require "yaml"; require "json"; puts JSON.generate(YAML.safe_load_file(ARGV.fetch(0)))',
      filePath,
    ],
    { encoding: "utf8" },
  );
  return JSON.parse(json);
}

function requiredJobs(workflow, jobId, found = new Set()) {
  const needs = workflow.jobs[jobId]?.needs ?? [];
  for (const required of Array.isArray(needs) ? needs : [needs]) {
    if (found.has(required)) continue;
    found.add(required);
    requiredJobs(workflow, required, found);
  }
  return found;
}

function resolveExpression(value, inputs, outcomes, outputs) {
  return String(value).replace(
    /\$\{\{\s*([^}]+?)\s*\}\}/g,
    (_match, expression) => {
      const input = expression.match(/^inputs\.(.+)$/);
      if (input) return inputs[input[1]] ?? "";
      const outcome = expression.match(/^steps\.([\w-]+)\.outcome$/);
      if (outcome) return outcomes[outcome[1]] ?? "success";
      const output = expression.match(/^steps\.([\w-]+)\.outputs\.([\w-]+)$/);
      if (output) return outputs[output[1]]?.[output[2]] ?? "";
      return "";
    },
  );
}

function runAction({
  codeExit = 0,
  codeReportUrl = "https://app.snyk.io/org/organization/projects",
  containerExit = 0,
  containerOutput,
  containerScanExit = 0,
  githubRef = "refs/heads/main",
  githubSha = sourceSha,
  helmFailEnvironment = "",
  iacExit = 0,
  iacReportUrl = "https://app.snyk.io/org/organization/projects",
  incompleteSarifFile = "",
  inputs: inputOverrides = {},
  invalidSarifFile = "",
  monitorProjectId = openSourceProjectId,
  openSourceExit = 0,
  openSourceTestExit = 0,
  supersedeAfterOpenSourceScan = false,
  trustedMainSha = sourceSha,
} = {}) {
  const action = loadAction();
  const directory = mkdtempSync(join(tmpdir(), "snyk-baseline-action-"));
  const bin = join(directory, "bin");
  const tracePath = join(directory, "commands");
  const advancedMainMarker = join(directory, "advanced-main");
  const containerResultPath = join(directory, "container-results.json");
  const outcomes = {};
  const outputs = {};
  const diagnostics = [];
  const inputs = Object.fromEntries(
    Object.entries(action.inputs ?? {}).map(([name, definition]) => [
      name,
      definition.default ?? "",
    ]),
  );
  Object.assign(inputs, {
    dockerfile: "Dockerfile",
    "image-ref": `registry.example.test/rcw@sha256:${"a".repeat(64)}`,
    "open-source-project-id": openSourceProjectId,
    "org-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "snyk-client-id": "client-id",
    "snyk-client-secret": "client-secret",
    "source-sha": sourceSha,
    ...inputOverrides,
  });
  mkdirSync(join(directory, "deploy/laa-record-controlled-work/values"), {
    recursive: true,
  });
  writeFileSync(join(directory, "Dockerfile"), "FROM node:26-alpine\n");
  writeFileSync(join(directory, ".snyk"), "version: v1.25.0\n");
  for (const environment of ["uat", "staging", "production"]) {
    writeFileSync(
      join(
        directory,
        `deploy/laa-record-controlled-work/values/${environment}.yaml`,
      ),
      "replicaCount: 1\n",
    );
  }
  mkdirSync(bin, { recursive: true });
  writeFileSync(tracePath, "");
  writeFileSync(
    containerResultPath,
    containerOutput ?? JSON.stringify(containerResults),
  );
  writeFileSync(
    join(bin, "snyk"),
    `#!/bin/bash
printf '%s\\n' "$*" >> "$COMMAND_TRACE"
json_output=
sarif_output=
for argument in "$@"; do
  case "$argument" in
    --json-file-output=*) json_output=\${argument#*=} ;;
    --sarif-file-output=*) sarif_output=\${argument#*=} ;;
  esac
done
if [[ -n "$json_output" ]]; then
  if [[ "$1" == "container" && "$2" == "test" ]]; then
    cp "$CONTAINER_RESULT" "$json_output"
  else
    printf '{"ok":true}\\n' > "$json_output"
  fi
fi
if [[ -n "$sarif_output" ]]; then
  mkdir -p "$(dirname "$sarif_output")"
  if [[ "$sarif_output" == "$INVALID_SARIF_FILE" ]]; then
    printf '{"version":' > "$sarif_output"
  elif [[ "$sarif_output" == "$INCOMPLETE_SARIF_FILE" ]]; then
    printf '{"version":"2.1.0","runs":[{}]}\\n' > "$sarif_output"
  else
    printf '{"version":"2.1.0","runs":[{"tool":{"driver":{"name":"Snyk"}}}]}\\n' > "$sarif_output"
  fi
fi
if [[ "$1" == "test" && "$ADVANCE_MAIN_AFTER_OPEN_SOURCE_SCAN" == "true" ]]; then
  touch "$ADVANCED_MAIN_MARKER"
fi
report_url=$CODE_REPORT_URL
if [[ "$1" == "iac" ]]; then report_url=$IAC_REPORT_URL; fi
if [[ -n "$report_url" ]]; then
  for argument in "$@"; do
    if [[ "$argument" == '--report' ]]; then
      printf 'Your test results are available at: %s\\n' "$report_url"
    fi
  done
fi
if [[ "$1" == "monitor" ]]; then
  printf 'Explore this snapshot at: https://app.snyk.io/org/organization/project/%s/history/%s\\n' \\
    "$OSS_PROJECT_ID" "22222222-2222-4222-8222-222222222222"
  exit "$OSS_MONITOR_EXIT"
fi
if [[ "$1" == "test" ]]; then exit "$OSS_TEST_EXIT"; fi
if [[ "$1" == "container" && "$2" == "test" ]]; then
  exit "$CONTAINER_SCAN_EXIT"
fi
if [[ "$1" == "container" && "$2" == "monitor" ]]; then exit "$CONTAINER_MONITOR_EXIT"; fi
if [[ "$1" == "code" && "$2" == "test" ]]; then exit "$CODE_EXIT"; fi
if [[ "$1" == "iac" && "$2" == "test" ]]; then exit "$IAC_EXIT"; fi
exit 0
`,
    { mode: 0o755 },
  );
  writeFileSync(
    join(bin, "helm"),
    `#!/bin/bash
printf 'helm %s\\n' "$*" >> "$COMMAND_TRACE"
if [[ -n "$HELM_FAIL_ENVIRONMENT" && "$*" == *"/$HELM_FAIL_ENVIRONMENT.yaml"* ]]; then
  exit 1
fi
printf 'rendered manifests\\n'
`,
    { mode: 0o755 },
  );
  writeFileSync(join(bin, "npm"), "#!/bin/bash\\nexit 0\\n", { mode: 0o755 });
  writeFileSync(
    join(bin, "git"),
    `#!/bin/bash
if [[ "$1" == "fetch" ]]; then exit 0; fi
if [[ "$1" == "rev-parse" ]]; then
  if [[ -f "$ADVANCED_MAIN_MARKER" ]]; then
    printf '%s\\n' "$SUPERSEDED_MAIN_SHA"
  else
    printf '%s\\n' "$TRUSTED_MAIN_SHA"
  fi
  exit 0
fi
exit 2
`,
    { mode: 0o755 },
  );

  try {
    for (const [index, step] of action.runs.steps.entries()) {
      const stepId = step.id ?? `step-${index}`;
      if (!shouldRun(step.if, outcomes, outputs)) {
        outcomes[stepId] = "skipped";
        continue;
      }
      if (!step.run) {
        outcomes[stepId] = "success";
        diagnostics.push(`${stepId}: success (external action stubbed)`);
        if (step.with?.client_id !== undefined) {
          outputs[stepId] = { token: "test-oauth-token" };
        }
        continue;
      }

      const outputPath = join(directory, `output-${stepId}`);
      writeFileSync(outputPath, "");
      const env = { ...process.env };
      for (const [name, value] of Object.entries(step.env ?? {})) {
        env[name] = resolveExpression(value, inputs, outcomes, outputs);
      }
      Object.assign(env, {
        ADVANCE_MAIN_AFTER_OPEN_SOURCE_SCAN: String(
          supersedeAfterOpenSourceScan,
        ),
        ADVANCED_MAIN_MARKER: advancedMainMarker,
        CODE_EXIT: String(codeExit),
        CODE_REPORT_URL: codeReportUrl,
        COMMAND_TRACE: tracePath,
        CONTAINER_MONITOR_EXIT: String(containerExit),
        CONTAINER_RESULT: containerResultPath,
        CONTAINER_SCAN_EXIT: String(containerScanExit),
        GITHUB_EVENT_NAME: "workflow_dispatch",
        GITHUB_OUTPUT: outputPath,
        GITHUB_REF: githubRef,
        GITHUB_SHA: githubSha,
        HELM_FAIL_ENVIRONMENT: helmFailEnvironment,
        IAC_EXIT: String(iacExit),
        IAC_REPORT_URL: iacReportUrl,
        INCOMPLETE_SARIF_FILE: incompleteSarifFile,
        INVALID_SARIF_FILE: invalidSarifFile,
        OSS_MONITOR_EXIT: String(openSourceExit),
        OSS_PROJECT_ID: monitorProjectId,
        OSS_TEST_EXIT: String(openSourceTestExit),
        PATH: `${bin}:${process.env.PATH}`,
        SUPERSEDED_MAIN_SHA: "ffffffffffffffffffffffffffffffffffffffff",
        TRUSTED_MAIN_SHA: trustedMainSha,
      });
      const result = spawnSync(
        "/bin/bash",
        ["-e", "-o", "pipefail", "-c", step.run],
        {
          cwd: directory,
          encoding: "utf8",
          env,
        },
      );
      outcomes[stepId] = result.status === 0 ? "success" : "failure";
      diagnostics.push(
        `${stepId}: ${outcomes[stepId]}\n${result.stdout}${result.stderr}`,
      );
      for (const line of readFileSync(outputPath, "utf8").split("\n")) {
        const separator = line.indexOf("=");
        if (separator > 0) {
          (outputs[stepId] ??= {})[line.slice(0, separator)] = line.slice(
            separator + 1,
          );
        }
      }
      if (result.status !== 0 && !step["continue-on-error"]) break;
      if (result.error) throw result.error;
    }

    const outputValue = action.outputs?.outcome?.value?.match(
      /steps\.([\w-]+)\.outputs\.([\w-]+)/,
    );
    const publicationStateValue = action.outputs?.[
      "publication-state"
    ]?.value?.match(/steps\.([\w-]+)\.outputs\.([\w-]+)/);
    const actionOutputs = Object.fromEntries(
      Object.entries(action.outputs ?? {}).map(([name, definition]) => {
        const outputReference = definition.value?.match(
          /steps\.([\w-]+)\.outputs\.([\w-]+)/,
        );
        return [
          name,
          outputReference
            ? outputs[outputReference[1]]?.[outputReference[2]]
            : undefined,
        ];
      }),
    );
    return {
      actionOutputs,
      commands: readFileSync(tracePath, "utf8"),
      diagnostics: diagnostics.join("\n"),
      directory,
      outcome: outputValue
        ? outputs[outputValue[1]]?.[outputValue[2]]
        : undefined,
      publicationState: publicationStateValue
        ? outputs[publicationStateValue[1]]?.[publicationStateValue[2]]
        : undefined,
    };
  } catch (error) {
    rmSync(directory, { force: true, recursive: true });
    throw error;
  }
}

function shouldRun(condition, outcomes, outputs) {
  if (!condition || String(condition).includes("always()")) return true;
  const requiredSteps = [
    ...String(condition).matchAll(/steps\.([\w-]+)\.outcome\s*==\s*'success'/g),
  ];
  const requiredOutputs = [
    ...String(condition).matchAll(
      /steps\.([\w-]+)\.outputs\.([\w-]+)\s*==\s*'([^']+)'/g,
    ),
  ];
  return (
    requiredSteps.every(([, stepId]) => outcomes[stepId] === "success") &&
    requiredOutputs.every(
      ([, stepId, outputName, expectedValue]) =>
        outputs[stepId]?.[outputName] === expectedValue,
    )
  );
}

test("an Open Source monitor exit code 1 fails publication", () => {
  const run = runAction({ openSourceExit: 1 });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /monitor/);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Open Source publication must refresh the configured baseline project", () => {
  const run = runAction({
    monitorProjectId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(
      run.diagnostics,
      /Open Source monitor did not confirm the configured project/,
    );
    assert.match(run.commands, /^container monitor /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Container publication failure does not suppress Open Source publication", () => {
  const run = runAction({ containerExit: 1 });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^container monitor /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("incomplete Container results are not published", () => {
  const run = runAction({
    containerOutput: JSON.stringify(containerResults.slice(0, 1)),
  });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^container test /m);
    assert.doesNotMatch(run.commands, /^container monitor /m);
    assert.match(
      run.diagnostics,
      /lacks OS\/base-image or application coverage/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a missing Container image does not suppress Open Source publication", () => {
  const run = runAction({ inputs: { "image-ref": "" } });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.doesNotMatch(run.commands, /^container test /m);
    assert.match(
      run.diagnostics,
      /Container image must use its CI-built sha256 digest/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a missing Dockerfile does not suppress independent product publication", () => {
  const run = runAction({ inputs: { dockerfile: "missing.Dockerfile" } });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^code test .*--report /m);
    assert.match(run.commands, /^iac test .*--report /m);
    assert.doesNotMatch(run.commands, /^container test /m);
    assert.doesNotMatch(run.commands, /^container monitor /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("an invalid OSS project UUID does not suppress independent publication", () => {
  const run = runAction({
    inputs: { "open-source-project-id": "not-a-project-uuid" },
  });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^test --all-projects /m);
    assert.doesNotMatch(run.commands, /^monitor /m);
    assert.match(run.commands, /^container monitor /m);
    assert.match(run.commands, /^code test .*--report /m);
    assert.match(run.commands, /^iac test .*--report /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Container setup failure does not suppress independent product publication", () => {
  const run = runAction({ inputs: { "container-setup-outcome": "failure" } });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^code test .*--report /m);
    assert.match(run.commands, /^iac test .*--report /m);
    assert.doesNotMatch(run.commands, /^container test /m);
    assert.doesNotMatch(run.commands, /^container monitor /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Open Source publication failure does not suppress Container publication", () => {
  const run = runAction({ openSourceExit: 1 });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^container test /m);
    assert.match(run.commands, /^container monitor /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("main refresh scans and publishes all four products despite findings", () => {
  const run = runAction({
    codeExit: 1,
    containerScanExit: 1,
    iacExit: 1,
    openSourceTestExit: 1,
  });
  try {
    assert.equal(run.outcome, "passed", run.diagnostics);
    assert.match(run.commands, /^test --all-projects --fail-fast --dev /m);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^container test /m);
    assert.match(run.commands, /^container monitor /m);
    assert.match(
      run.commands,
      /^container monitor .*--project-name=laa-record-controlled-work-container .*--target-reference=main/m,
    );
    assert.match(run.commands, /^code test .*--report .*--sarif-file-output=/m);
    assert.match(run.commands, /^iac test .*--report .*--sarif-file-output=/m);
    for (const environment of ["uat", "staging", "production"]) {
      assert.match(
        run.commands,
        new RegExp(`helm template .*values/${environment}\\.yaml`),
      );
      assert.match(
        run.commands,
        new RegExp(
          `--target-name=laa-record-controlled-work-iac-${environment}`,
        ),
      );
    }
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("an IaC render failure does not suppress other environments or products", () => {
  const run = runAction({ helmFailEnvironment: "staging" });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^monitor /m);
    assert.match(run.commands, /^container monitor /m);
    assert.match(
      run.commands,
      /--target-name=laa-record-controlled-work-iac-uat/,
    );
    assert.doesNotMatch(
      run.commands,
      /--target-name=laa-record-controlled-work-iac-staging/,
    );
    assert.match(
      run.commands,
      /--target-name=laa-record-controlled-work-iac-production/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("Code findings fail publication when the CLI provides no dashboard URL", () => {
  const run = runAction({ codeExit: 1, codeReportUrl: "" });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^code test .*--report /m);
    assert.match(run.commands, /^iac test .*--report /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("IaC findings require dashboard confirmation for every environment", () => {
  const run = runAction({ iacExit: 1, iacReportUrl: "" });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(run.commands, /^code test .*--report /m);
    assert.equal(
      [
        ...run.diagnostics.matchAll(
          /IaC (uat|staging|production) scan did not confirm/g,
        ),
      ].length,
      3,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("report command failures remain errors when the CLI prints a dashboard URL", () => {
  const run = runAction({ codeExit: 2, iacExit: 3 });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.match(
      run.diagnostics,
      /Code scan or publication failed with exit code 2/,
    );
    assert.match(
      run.diagnostics,
      /IaC uat scan or publication failed with exit code 3/,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("untrusted refs and mismatched source SHAs cannot publish", () => {
  for (const scenario of [
    { githubRef: "refs/heads/feature" },
    {
      githubSha: "ffffffffffffffffffffffffffffffffffffffff",
      inputs: { "source-sha": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" },
    },
  ]) {
    const run = runAction(scenario);
    try {
      assert.equal(run.outcome, "failed", run.diagnostics);
      assert.equal(run.commands, "");
    } finally {
      rmSync(run.directory, { force: true, recursive: true });
    }
  }
});

test("a superseded main commit is skipped before publication", () => {
  const run = runAction({
    trustedMainSha: "ffffffffffffffffffffffffffffffffffffffff",
  });
  try {
    assert.equal(run.outcome, "skipped", run.diagnostics);
    assert.equal(run.commands, "");
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("a commit superseded during scanning is skipped before publication", () => {
  const run = runAction({ supersedeAfterOpenSourceScan: true });
  try {
    assert.equal(run.outcome, "skipped", run.diagnostics);
    assert.equal(run.publicationState, "stale");
    assert.match(run.commands, /^test --all-projects /m);
    assert.doesNotMatch(run.commands, /^monitor /m);
    assert.doesNotMatch(run.commands, /^container monitor /m);
    assert.doesNotMatch(run.commands, /^code test /m);
    assert.doesNotMatch(run.commands, /^iac test /m);
    assert.deepEqual(
      availableSarifUploads(loadYaml(publisherWorkflowPath), run),
      [],
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("available SARIF remains eligible after a current-source scan failure", () => {
  const run = runAction({ codeExit: 2 });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.equal(run.publicationState, "current");
    assert.deepEqual(
      availableSarifUploads(loadYaml(publisherWorkflowPath), run),
      [
        "snyk-open-source",
        "snyk-container",
        "snyk-code",
        "snyk-iac-uat",
        "snyk-iac-staging",
        "snyk-iac-production",
      ],
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("malformed SARIF from a failed scan is not upload eligible", () => {
  const run = runAction({
    codeExit: 2,
    invalidSarifFile: "sarif/snyk-code.sarif",
  });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.equal(run.publicationState, "current");
    assert.equal(run.actionOutputs["code-sarif-valid"], "false");
    assert.deepEqual(
      availableSarifUploads(loadYaml(publisherWorkflowPath), run),
      [
        "snyk-open-source",
        "snyk-container",
        "snyk-iac-uat",
        "snyk-iac-staging",
        "snyk-iac-production",
      ],
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("SARIF without tool metadata is not upload eligible", () => {
  const run = runAction({
    codeExit: 2,
    incompleteSarifFile: "sarif/snyk-code.sarif",
  });
  try {
    assert.equal(run.outcome, "failed", run.diagnostics);
    assert.equal(run.actionOutputs["code-sarif-valid"], "false");
    assert.deepEqual(
      availableSarifUploads(loadYaml(publisherWorkflowPath), run),
      [
        "snyk-open-source",
        "snyk-container",
        "snyk-iac-uat",
        "snyk-iac-staging",
        "snyk-iac-production",
      ],
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("automatic and manual publishers share an ordered non-cancelling queue", () => {
  const action = loadAction();
  assert.ok(
    existsSync(publisherWorkflowPath),
    "The Snyk monitor workflow is missing",
  );
  const workflow = loadYaml(publisherWorkflowPath);
  const triggers = workflow.on ?? workflow.true;
  const publisher = workflow.jobs.publish;
  assert.ok(triggers.workflow_call);
  assert.ok(Object.hasOwn(triggers, "workflow_dispatch"));
  assert.equal(triggers.workflow_dispatch.inputs.ci_run_id.required, true);
  assert.equal(triggers.workflow_dispatch.inputs.image_digest.required, true);
  assert.equal(
    publisher.concurrency.group,
    "snyk-publication-${{ github.repository }}",
  );
  assert.equal(publisher.concurrency.queue, "max");
  assert.equal(publisher.concurrency["cancel-in-progress"], false);
  assert.equal(
    publisher.steps.find((step) => step.id === "refresh").uses,
    "./.github/actions/snyk-baseline",
  );

  const uploads = publisher.steps.filter((step) =>
    step.uses?.includes("upload-sarif@"),
  );
  assert.equal(
    action.outputs["publication-state"].value,
    "${{ steps.aggregate.outputs.publication-state }}",
  );
  for (const outputName of Object.values(sarifOutputByCategory)) {
    assert.ok(action.outputs[outputName]);
  }
  assert.deepEqual(
    uploads.map((step) => step.with.category),
    [
      "snyk-open-source",
      "snyk-container",
      "snyk-code",
      "snyk-iac-uat",
      "snyk-iac-staging",
      "snyk-iac-production",
    ],
  );
  assert.ok(
    uploads.every(
      (step) =>
        String(step.if).includes("always()") &&
        String(step.if).includes(
          "steps.refresh.outputs.publication-state == 'current'",
        ),
    ),
  );
  assert.ok(uploads.every((step) => step["continue-on-error"] === true));
  const nightly = loadYaml(nightlyWorkflowPath);
  assert.deepEqual(nightly.jobs.snyk.concurrency, publisher.concurrency);
});

test("a required native SARIF upload failure fails the publisher", () => {
  const workflow = loadYaml(publisherWorkflowPath);
  const aggregate = workflow.jobs.publish.steps.find(
    (step) => step.name === "Confirm refresh and upload outcomes",
  );
  assert.ok(aggregate?.run, "The publisher must aggregate upload outcomes");
  const result = spawnSync(
    "/bin/bash",
    ["-e", "-o", "pipefail", "-c", aggregate.run],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        CODE_UPLOAD_OUTCOME: "failure",
        CONTAINER_UPLOAD_OUTCOME: "success",
        IAC_PRODUCTION_UPLOAD_OUTCOME: "success",
        IAC_STAGING_UPLOAD_OUTCOME: "success",
        IAC_UAT_UPLOAD_OUTCOME: "success",
        OSS_UPLOAD_OUTCOME: "success",
        REFRESH_OUTCOME: "passed",
      },
    },
  );
  assert.notEqual(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /A native GitHub Security upload failed/);
});

test("main CI hands off its built digest without gating deployment on monitoring", () => {
  const workflow = loadYaml(ciWorkflowPath);
  const jobs = workflow.jobs;
  const monitor = jobs["snyk-monitor"];
  assert.ok(monitor, "Main CI must call the baseline publisher");
  assert.equal(monitor.uses, "./.github/workflows/snyk-monitor.yml");
  assert.deepEqual(monitor.needs, ["build-image"]);
  assert.equal(monitor.with.source_sha, "${{ github.sha }}");
  assert.equal(monitor.with.ci_run_id, "${{ github.run_id }}");
  assert.equal(
    monitor.with.image_digest,
    "${{ needs.build-image.outputs.image_digest }}",
  );
  assert.equal(Object.hasOwn(monitor.with, "image_repo"), false);
  assert.equal(monitor.permissions["security-events"], "write");
  assert.equal(
    jobs.snyk.with.scan_mode,
    "${{ (github.event_name == 'pull_request' || github.event_name == 'merge_group') && 'delta' || 'absolute' }}",
  );
  assert.match(jobs.snyk.if, /workflow_dispatch/);
  assert.match(jobs.snyk.if, /refs\/heads\/main/);
  assert.equal(requiredJobs(workflow, "deploy-uat").has("snyk-monitor"), false);
  assert.equal(
    requiredJobs(workflow, "deploy-staging").has("snyk-monitor"),
    false,
  );
  assert.ok(jobs["notify-main-ci-failure"].needs.includes("snyk-monitor"));
});
