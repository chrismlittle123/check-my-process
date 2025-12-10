import type { CheckContext, CheckResult } from "./types.js";

export function checkMinApprovals(ctx: CheckContext): CheckResult {
  const minApprovals = ctx.config.pr?.min_approvals;
  const severity = ctx.config.pr?.severity ?? ctx.config.settings.default_severity;

  if (minApprovals === undefined) {
    return {
      rule: "pr.min_approvals",
      status: "skipped",
      message: "min_approvals not configured",
      severity,
    };
  }

  const passed = ctx.pr.approvalCount >= minApprovals;
  return {
    rule: "pr.min_approvals",
    status: passed ? "passed" : "failed",
    message: passed
      ? `${ctx.pr.approvalCount} approvals (min: ${minApprovals})`
      : `${ctx.pr.approvalCount} approvals, need ${minApprovals}`,
    expected: minApprovals,
    actual: ctx.pr.approvalCount,
    severity,
  };
}
