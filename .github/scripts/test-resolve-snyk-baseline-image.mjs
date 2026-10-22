import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL("../..", import.meta.url)));
const publisherWorkflowPath = join(
  repoRoot,
  ".github/workflows/snyk-monitor.yml",
);
const sourceSha = "0123456789012345678901234567890123456789";
const imageDigest = `sha256:${"a".repeat(64)}`;
const registryUrl = "123456789012.dkr.ecr.us-west-2.amazonaws.com";
const repository = "laa-record-controlled-work";

function loadImageResolver() {
  const workflow = execFileSync(
    "ruby",
    [
      "-e",
      'require "yaml"; require "json"; puts JSON.generate(YAML.safe_load_file(ARGV.fetch(0)))',
      publisherWorkflowPath,
    ],
    { encoding: "utf8" },
  );
  const parsedWorkflow = JSON.parse(workflow);
  const resolver = parsedWorkflow.jobs.publish.steps.find(
    (step) => step.id === "resolve-image",
  );
  assert.ok(
    resolver?.run,
    "The publisher workflow must resolve its image inline",
  );
  return resolver.run;
}

function makeExecutable(path, content) {
  writeFileSync(path, content, { mode: 0o755 });
}

function runResolver({
  ciRunId = "",
  digest = imageDigest,
  githubRef = "refs/heads/main",
  githubSha = sourceSha,
  imageDigestInput = "",
  jobs = { jobs: [] },
  runData = {
    event: "push",
    head_branch: "main",
    head_sha: sourceSha,
    path: ".github/workflows/cicd.yml@refs/heads/main",
  },
  runs = [],
  source = sourceSha,
}) {
  const resolver = loadImageResolver();
  const directory = mkdtempSync(join(tmpdir(), "snyk-image-resolver-"));
  const bin = join(directory, "bin");
  const outputPath = join(directory, "output");
  const tracePath = join(directory, "commands");
  mkdirSync(bin, { recursive: true });
  writeFileSync(outputPath, "");
  writeFileSync(tracePath, "");
  makeExecutable(
    join(bin, "curl"),
    `#!/bin/bash
printf 'curl %s\\n' "$*" >> "$COMMAND_TRACE"
url=
for argument in "$@"; do url="$argument"; done
case "$url" in
  */actions/workflows/cicd.yml/runs?*) printf '%s' "$WORKFLOW_RUNS" ;;
  */actions/runs/*/jobs?*) printf '%s' "$WORKFLOW_JOBS" ;;
  */actions/runs/*) printf '%s' "$WORKFLOW_RUN_DATA" ;;
  *) exit 22 ;;
esac
`,
  );
  makeExecutable(
    join(bin, "aws"),
    `#!/bin/bash
printf 'aws %s\\n' "$*" >> "$COMMAND_TRACE"
if [[ "$1" == "ecr" && "$2" == "describe-images" && "$*" == *"imageTag=$SOURCE_SHA"* ]]; then
  printf '%s\\n' "$ECR_DIGEST"
  exit 0
fi
exit 2
`,
  );

  const result = spawnSync(
    "/bin/bash",
    ["-e", "-o", "pipefail", "-c", resolver],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        AWS_AUTH_OUTCOME: "success",
        CI_RUN_ID: ciRunId,
        COMMAND_TRACE: tracePath,
        ECR_DIGEST: digest,
        ECR_REGISTRY_URL: registryUrl,
        ECR_REPOSITORY: repository,
        GH_TOKEN: "test-token",
        GITHUB_API_URL: "https://api.github.com",
        GITHUB_OUTPUT: outputPath,
        GITHUB_REF: githubRef,
        GITHUB_REPOSITORY: "ministryofjustice/laa-record-controlled-work",
        GITHUB_SHA: githubSha,
        IMAGE_DIGEST: imageDigestInput,
        PATH: `${bin}:${process.env.PATH}`,
        SOURCE_SHA: source,
        WORKFLOW_JOBS: JSON.stringify(jobs),
        WORKFLOW_RUN_DATA: JSON.stringify(runData),
        WORKFLOW_RUNS: JSON.stringify({ workflow_runs: runs }),
      },
    },
  );

  return {
    ...result,
    commands: readFileSync(tracePath, "utf8"),
    directory,
    output: readFileSync(outputPath, "utf8"),
  };
}

test("manual recovery resolves the image built for the exact main SHA", () => {
  const run = runResolver({
    ciRunId: "123",
    imageDigestInput: imageDigest,
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(
      run.output,
      `image_ref=${registryUrl}/${repository}@${imageDigest}\nimage_status=success\n`,
    );
    assert.match(run.commands, /actions\/runs\/123/);
    assert.match(run.commands, /actions\/runs\/123\/jobs/);
    assert.match(run.commands, new RegExp(`imageTag=${sourceSha}`));
    assert.doesNotMatch(run.commands, /docker build/);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("manual recovery accepts an image build despite unrelated CI failure", () => {
  const run = runResolver({
    ciRunId: "124",
    imageDigestInput: imageDigest,
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(
      run.output,
      `image_ref=${registryUrl}/${repository}@${imageDigest}\nimage_status=success\n`,
    );
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("manual recovery requires an explicit successful run and build digest", () => {
  const run = runResolver({
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
    runs: [
      {
        event: "push",
        head_branch: "main",
        head_sha: sourceSha,
        id: 123,
      },
    ],
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.match(run.stdout, /run id and image digest are required/);
    assert.doesNotMatch(run.commands, /^aws /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("manual recovery rejects a digest that does not match its source tag", () => {
  const run = runResolver({
    ciRunId: "123",
    imageDigestInput: `sha256:${"b".repeat(64)}`,
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.match(run.stdout, /does not match the CI image for this source/);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("automatic publication verifies the caller run and matching immutable digest", () => {
  const run = runResolver({
    ciRunId: "123",
    imageDigestInput: imageDigest,
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(
      run.output,
      `image_ref=${registryUrl}/${repository}@${imageDigest}\nimage_status=success\n`,
    );
    assert.match(run.commands, /actions\/runs\/123/);
    assert.match(run.commands, /actions\/runs\/123\/jobs/);
    assert.match(run.commands, new RegExp(`imageTag=${sourceSha}`));
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("automatic publication rejects a digest that does not match the source tag", () => {
  const run = runResolver({
    ciRunId: "123",
    imageDigestInput: `sha256:${"b".repeat(64)}`,
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.match(run.stdout, /does not match the CI image for this source/);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("caller run must match the trusted main source and workflow", () => {
  const run = runResolver({
    ciRunId: "123",
    runData: {
      event: "push",
      head_branch: "main",
      head_sha: "f".repeat(40),
      path: ".github/workflows/cicd.yml@refs/heads/main",
    },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.doesNotMatch(run.commands, /^aws /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("caller run must come from the exact CICD workflow path", () => {
  const run = runResolver({
    ciRunId: "123",
    imageDigestInput: imageDigest,
    jobs: { jobs: [{ conclusion: "success", name: "Build Docker Image" }] },
    runData: {
      event: "push",
      head_branch: "main",
      head_sha: sourceSha,
      path: ".github/workflows/cicd.yml-shadow.yml@refs/heads/main",
    },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.match(
      run.stdout,
      /caller CI run does not match trusted main source/,
    );
    assert.doesNotMatch(run.commands, /^aws /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("manual recovery requires a successful matching image build", () => {
  const run = runResolver({
    ciRunId: "123",
    imageDigestInput: imageDigest,
    jobs: { jobs: [{ conclusion: "failure", name: "Build Docker Image" }] },
  });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.match(run.commands, /actions\/runs\/123\/jobs/);
    assert.doesNotMatch(run.commands, /^aws /m);
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});

test("untrusted refs do not resolve or publish an image", () => {
  const run = runResolver({ githubRef: "refs/heads/feature/test" });
  try {
    assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
    assert.equal(run.output, "image_ref=\nimage_status=failure\n");
    assert.equal(run.commands, "");
  } finally {
    rmSync(run.directory, { force: true, recursive: true });
  }
});
