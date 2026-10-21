import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const containerResults = JSON.parse(
  readFileSync(join(directory, "fixtures", "container-results.json"), "utf8"),
);
const orgId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function baselineIssue(vulnerability, from = vulnerability.from) {
  return {
    fixInfo: {
      fixedIn: [],
      isPatchable: false,
      isPinnable: false,
      isUpgradable: false,
    },
    from: from.slice(1),
    id: vulnerability.id,
    isIgnored: false,
    isPatched: false,
    issueData: {
      credit: [],
      cvssScore: vulnerability.severity === "critical" ? 9.8 : 8.0,
      CVSSv3: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      description: "Sanitized test data",
      disclosureTime: "2026-01-01T00:00:00Z",
      exploitMaturity: "no-known-exploit",
      id: vulnerability.id,
      identifiers: { CVE: [], CWE: [] },
      isMaliciousPackage: false,
      language: "js",
      nearestFixedInVersion: "2.0.0",
      originalSeverity: vulnerability.severity,
      patches: [],
      publicationTime: "2026-01-01T00:00:00Z",
      semver: { vulnerable: ["<2.0.0"] },
      severity: vulnerability.severity,
      title: "Sanitized vulnerability",
      url: "https://example.invalid/advisory",
    },
    issueType: "vuln",
    pkgName: vulnerability.package,
    pkgVersions: [vulnerability.version],
  };
}

async function compare({ baseline, current, delta, snyk }) {
  const savedArgv = process.argv;
  const savedEnvironment = Object.fromEntries(
    ["NODE_ENV", "TYPE"].map((key) => [key, process.env[key]]),
  );
  let baselineReads = 0;
  snyk.getProjectIssues = async () => {
    baselineReads += 1;
    return { issues: { licenses: [], vulnerabilities: baseline } };
  };
  process.env.NODE_ENV = "test";
  process.env.TYPE = "vuln";
  process.argv = [
    process.execPath,
    "snyk-delta",
    "--baselineOrg",
    orgId,
    "--baselineProject",
    projectId,
    "--type",
    "vuln",
  ];
  try {
    return {
      ...(await delta.getDelta(JSON.stringify(current))),
      baselineReads,
    };
  } finally {
    process.argv = savedArgv;
    for (const [key, value] of Object.entries(savedEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    process.exitCode = 0;
  }
}

test(
  "pinned Delta accepts sanitized CLI Container results and preserves its comparison policy",
  { timeout: 120000 },
  async () => {
    const installed = spawnSync(
      "npm",
      [
        "exec",
        "--yes",
        "--package=snyk-delta@1.14.0",
        "--",
        "which",
        "snyk-delta",
      ],
      { encoding: "utf8" },
    );
    assert.equal(installed.status, 0, `${installed.stdout}${installed.stderr}`);
    const deltaPath = installed.stdout.trim().split("\n").at(-1);
    const packageRoot = resolve(dirname(deltaPath), "..", "snyk-delta");
    const packageRequire = createRequire(join(packageRoot, "package.json"));
    const delta = packageRequire(packageRoot);
    const snyk = packageRequire(join(packageRoot, "dist", "snyk", "snyk.js"));
    const version = spawnSync(deltaPath, ["--version"], { encoding: "utf8" });
    assert.equal(version.status, 0, `${version.stdout}${version.stderr}`);
    assert.equal(version.stdout.trim(), "1.14.0");

    for (const result of containerResults) {
      const comparison = await compare({
        baseline: [],
        current: result,
        delta,
        snyk,
      });
      assert.equal(comparison.result, 1, JSON.stringify(comparison.newVulns));
    }

    const template = {
      packageManager: "npm",
      projectName: "rcw",
      severityThreshold: "high",
    };
    const current = (id, severity, version, from, type) => ({
      ...template,
      vulnerabilities: [
        {
          from,
          id,
          package: "example-package",
          severity,
          version,
          ...(type ? { type } : {}),
        },
      ],
    });
    const existing = current("SNYK-EXAMPLE-SAME", "high", "2.0.0", [
      "rcw@1.0.0",
      "example-package@2.0.0",
    ]);
    const existingComparison = await compare({
      baseline: [
        baselineIssue(existing.vulnerabilities[0], [
          "rcw@1.0.0",
          "example-package@1.0.0",
        ]),
      ],
      current: existing,
      delta,
      snyk,
    });
    assert.equal(existingComparison.baselineReads, 1);
    assert.equal(
      existingComparison.result,
      0,
      JSON.stringify(existingComparison.newVulns),
    );

    const unchanged = current("SNYK-EXAMPLE-UNCHANGED", "critical", "1.0.0", [
      "rcw@1.0.0",
      "example-package@1.0.0",
    ]);
    const unchangedComparison = await compare({
      baseline: [
        baselineIssue(unchanged.vulnerabilities[0], [
          "rcw@1.0.0",
          "example-package@1.0.0",
        ]),
      ],
      current: unchanged,
      delta,
      snyk,
    });
    assert.equal(
      unchangedComparison.result,
      0,
      JSON.stringify(unchangedComparison.newVulns),
    );

    const cleanComparison = await compare({
      baseline: [],
      current: { ...template, vulnerabilities: [] },
      delta,
      snyk,
    });
    assert.equal(cleanComparison.baselineReads, 1);
    assert.equal(cleanComparison.result, 0);

    const mediumComparison = await compare({
      baseline: [],
      current: current("SNYK-EXAMPLE-MEDIUM", "medium", "1.0.0", [
        "rcw@1.0.0",
        "example-package@1.0.0",
      ]),
      delta,
      snyk,
    });
    assert.equal(
      mediumComparison.result,
      0,
      "A lower-severity issue should pass",
    );
    const licenseComparison = await compare({
      baseline: [],
      current: current(
        "SNYK-EXAMPLE-LICENSE",
        "high",
        "1.0.0",
        ["rcw@1.0.0", "example-package@1.0.0"],
        "license",
      ),
      delta,
      snyk,
    });
    assert.equal(
      licenseComparison.result,
      0,
      "License findings should not enter the vulnerability gate",
    );

    const changedPath = current("SNYK-EXAMPLE-PATH", "high", "1.0.0", [
      "rcw@1.0.0",
      "new-parent@1.0.0",
      "example-package@1.0.0",
    ]);
    const changedPathComparison = await compare({
      baseline: [
        baselineIssue(changedPath.vulnerabilities[0], [
          "rcw@1.0.0",
          "old-parent@1.0.0",
          "example-package@1.0.0",
        ]),
      ],
      current: changedPath,
      delta,
      snyk,
    });
    assert.equal(
      changedPathComparison.result,
      1,
      JSON.stringify(changedPathComparison.newVulns),
    );
  },
);
