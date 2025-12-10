import type { CheckContext, CheckResult } from "./types.js";

export function checkMaxFiles(ctx: CheckContext): CheckResult {
  const maxFiles = ctx.config.pr?.max_files;
  const severity = ctx.config.pr?.severity ?? ctx.config.settings.default_severity;

  if (maxFiles === undefined) {
    return {
      rule: "pr.max_files",
      status: "skipped",
      message: "max_files not configured",
      severity,
    };
  }

  const passed = ctx.pr.filesChanged <= maxFiles;
  return {
    rule: "pr.max_files",
    status: passed ? "passed" : "failed",
    message: passed
      ? `${ctx.pr.filesChanged} files (max: ${maxFiles})`
      : `${ctx.pr.filesChanged} files exceeds limit of ${maxFiles}`,
    expected: maxFiles,
    actual: ctx.pr.filesChanged,
    severity,
  };
}

export function checkMaxLines(ctx: CheckContext): CheckResult {
  const maxLines = ctx.config.pr?.max_lines;
  const severity = ctx.config.pr?.severity ?? ctx.config.settings.default_severity;

  if (maxLines === undefined) {
    return {
      rule: "pr.max_lines",
      status: "skipped",
      message: "max_lines not configured",
      severity,
    };
  }

  const totalLines = ctx.pr.additions + ctx.pr.deletions;
  const passed = totalLines <= maxLines;
  return {
    rule: "pr.max_lines",
    status: passed ? "passed" : "failed",
    message: passed
      ? `${totalLines} lines (max: ${maxLines})`
      : `${totalLines} lines exceeds limit of ${maxLines}`,
    expected: maxLines,
    actual: totalLines,
    severity,
  };
}
