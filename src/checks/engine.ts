import type { CheckContext, CheckResult, CheckFn } from "./types.js";
import { checkMaxFiles, checkMaxLines } from "./pr-size.js";
import { checkMinApprovals } from "./approvals.js";
import { checkBranchPattern } from "./branch.js";
import { checkTicketReference } from "./ticket.js";

const ALL_CHECKS: CheckFn[] = [
  checkMaxFiles,
  checkMaxLines,
  checkMinApprovals,
  checkBranchPattern,
  checkTicketReference,
];

export interface CheckSummary {
  results: CheckResult[];
  passed: number;
  failed: number;
  skipped: number;
  hasErrors: boolean;
}

export function runChecks(ctx: CheckContext): CheckSummary {
  const results = ALL_CHECKS.map((check) => check(ctx));

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const hasErrors = results.some((r) => r.status === "failed" && r.severity === "error");

  return {
    results,
    passed,
    failed,
    skipped,
    hasErrors,
  };
}

export function groupResultsByCategory(results: CheckResult[]): Map<string, CheckResult[]> {
  const groups = new Map<string, CheckResult[]>();

  for (const result of results) {
    const category = result.rule.split(".")[0];
    const categoryName = getCategoryDisplayName(category);

    if (!groups.has(categoryName)) {
      groups.set(categoryName, []);
    }
    groups.get(categoryName)!.push(result);
  }

  return groups;
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    pr: "Pull Request",
    branch: "Branch",
    ticket: "Ticket",
  };
  return names[category] ?? category;
}
