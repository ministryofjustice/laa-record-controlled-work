import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scans = [
  { file: "snyk-open-source.sarif", name: "Open Source" },
  { file: "snyk-container.sarif", name: "Container" },
  { file: "snyk-code.sarif", name: "Code" },
  { file: "snyk-iac.sarif", name: "IaC" },
];

const severityNames = new Map([
  ["critical", "Critical"],
  ["high", "High"],
  ["low", "Low"],
  ["medium", "Medium"],
]);

export function formatFindings(reports) {
  const markdownSections = formatSections(reports, "markdown");
  const slackSections = formatSections(reports, "slack");

  return {
    markdown: markdownSections.length
      ? `${markdownSections.join("\n\n")}\n`
      : "No findings.\n",
    slack: slackSections.length
      ? `\n${slackSections.join("\n\n")}\n`
      : "No findings.\n",
  };
}

function formatFinding(finding, format) {
  const id = formatId(finding.id, format);
  return `- ${id} (${finding.severity}): ${finding.description} (${finding.location})`;
}

function formatId(id, format) {
  if (!/^SNYK-[A-Z0-9-]+$/.test(id)) return id;

  const url = `https://security.snyk.io/vuln/${id}`;
  return format === "slack" ? `<${url}|${id}>` : `[${id}](${url})`;
}

function formatSections(reports, format) {
  return scans.flatMap(({ name }) => {
    const findings = getFindings(reports[name]);
    if (findings.length === 0) return [];

    const heading =
      format === "slack" ? `*${name} findings*` : `### ${name} findings`;
    const rows = findings
      .map((finding) => formatFinding(finding, format))
      .join("\n");
    return [`${heading}\n\n${rows}`];
  });
}

function getFindings(report) {
  return (report?.runs ?? []).flatMap((run) =>
    (run.results ?? []).map((result) => normalizeFinding(run, result)),
  );
}

function getRule(run, result) {
  const rules = run.tool?.driver?.rules ?? [];
  return rules.find((rule) => rule.id === result.ruleId) ?? {};
}

function getSeverity(result, rule) {
  const title = rule.shortDescription?.text ?? "";
  const titleSeverity = title.match(
    /^(critical|high|medium|low) severity\b/i,
  )?.[1];
  const explicitSeverity =
    result.properties?.severity ??
    rule.properties?.severity ??
    rule.properties?.["problem.severity"] ??
    titleSeverity;

  if (explicitSeverity !== undefined && explicitSeverity !== null) {
    return (
      severityNames.get(String(explicitSeverity).toLowerCase()) ?? "Unknown"
    );
  }

  const rawScore =
    rule.properties?.["security-severity"] ??
    result.properties?.["security-severity"] ??
    rule.properties?.cvssv3_baseScore;
  const score = Number(rawScore);
  if (rawScore !== undefined && rawScore !== null && Number.isFinite(score)) {
    return severityFromScore(score);
  }

  if (result.level === "error") return "High";
  if (result.level === "warning") return "Medium";
  if (result.level === "note" || result.level === "info") return "Low";
  return "Unknown";
}

function main() {
  const reportDirectory = process.argv[2];
  if (!reportDirectory) {
    throw new Error("Usage: node format-snyk-findings.mjs <report-directory>");
  }

  const { markdown, slack } = formatFindings(readReports(reportDirectory));
  writeFileSync(join(reportDirectory, "findings.md"), markdown);
  writeFileSync(join(reportDirectory, "findings.txt"), slack);
}

function normalizeDescription(result, rule) {
  return (
    result.message?.text ??
    result.message?.markdown ??
    rule.shortDescription?.text ??
    "No description"
  )
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {2,}/g, " ");
}

function normalizeFinding(run, result) {
  const rule = getRule(run, result);
  const location = result.locations?.[0]?.physicalLocation;
  const file = location?.artifactLocation?.uri ?? "location unavailable";
  const line = location?.region?.startLine;

  return {
    description: normalizeDescription(result, rule),
    id: result.ruleId ?? "Unknown rule",
    location: line === undefined || line === null ? file : `${file}:${line}`,
    severity: getSeverity(result, rule),
  };
}

function readReports(reportDirectory) {
  return Object.fromEntries(
    scans.flatMap(({ file, name }) => {
      const path = join(reportDirectory, file);
      return existsSync(path)
        ? [[name, JSON.parse(readFileSync(path, "utf8"))]]
        : [];
    }),
  );
}

function severityFromScore(score) {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
