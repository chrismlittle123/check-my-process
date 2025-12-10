import chalk from "chalk";
import type { CheckResult, CheckSummary } from "./checks/index.js";
import { groupResultsByCategory } from "./checks/index.js";

export type OutputFormat = "text" | "json";

export interface FormatterOptions {
  format: OutputFormat;
  version: string;
  repo: string;
  prNumber: number;
}

export function formatResults(summary: CheckSummary, options: FormatterOptions): string {
  if (options.format === "json") {
    return formatJson(summary, options);
  }
  return formatText(summary, options);
}

function formatJson(summary: CheckSummary, options: FormatterOptions): string {
  return JSON.stringify(
    {
      version: options.version,
      repo: options.repo,
      pr: options.prNumber,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      results: summary.results,
    },
    null,
    2
  );
}

function formatText(summary: CheckSummary, options: FormatterOptions): string {
  const lines: string[] = [];

  lines.push(chalk.bold(`check-my-process v${options.version}`));
  lines.push("");
  lines.push(`Checking PR #${options.prNumber} in ${options.repo}...`);
  lines.push("");

  const groups = groupResultsByCategory(summary.results);

  for (const [category, results] of groups) {
    lines.push(chalk.bold.underline(category));

    for (const result of results) {
      lines.push(formatCheckResult(result));
    }

    lines.push("");
  }

  lines.push(chalk.dim("─".repeat(50)));

  const passedText = chalk.green(`${summary.passed} passed`);
  const failedText =
    summary.failed > 0 ? chalk.red(`${summary.failed} failed`) : `${summary.failed} failed`;
  const skippedText = summary.skipped > 0 ? chalk.dim(`, ${summary.skipped} skipped`) : "";

  lines.push(`Result: ${passedText}, ${failedText}${skippedText}`);

  return lines.join("\n");
}

function formatCheckResult(result: CheckResult): string {
  const icon = getStatusIcon(result.status);
  const ruleName = result.rule.split(".").slice(1).join(".");

  let line = `  ${icon} ${ruleName}: ${result.message}`;

  if (result.status === "failed" && result.expected !== undefined) {
    line += `\n    ${chalk.dim("Expected:")} ${result.expected}`;
  }

  return line;
}

function getStatusIcon(status: CheckResult["status"]): string {
  switch (status) {
    case "passed":
      return chalk.green("✓");
    case "failed":
      return chalk.red("✗");
    case "skipped":
      return chalk.dim("○");
  }
}
