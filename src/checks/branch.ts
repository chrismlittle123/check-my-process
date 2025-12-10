import type { CheckContext, CheckResult } from "./types.js";

export function checkBranchPattern(ctx: CheckContext): CheckResult {
  const pattern = ctx.config.branch?.pattern;
  const severity = ctx.config.branch?.severity ?? ctx.config.settings.default_severity;

  if (!pattern) {
    return {
      rule: "branch.pattern",
      status: "skipped",
      message: "branch pattern not configured",
      severity,
    };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    return {
      rule: "branch.pattern",
      status: "failed",
      message: `Invalid branch pattern regex: ${pattern}`,
      expected: pattern,
      actual: ctx.pr.branch,
      severity,
    };
  }

  const passed = regex.test(ctx.pr.branch);
  return {
    rule: "branch.pattern",
    status: passed ? "passed" : "failed",
    message: passed
      ? `Branch "${ctx.pr.branch}" matches pattern`
      : `Branch "${ctx.pr.branch}" doesn't match pattern`,
    expected: pattern,
    actual: ctx.pr.branch,
    severity,
  };
}
