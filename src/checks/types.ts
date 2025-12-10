import type { Config } from "../config/schema.js";
import type { PullRequestData } from "../github/types.js";

export type CheckStatus = "passed" | "failed" | "skipped";

export interface CheckResult {
  rule: string;
  status: CheckStatus;
  message: string;
  expected?: string | number;
  actual?: string | number;
  severity: "error" | "warning";
}

export interface CheckContext {
  pr: PullRequestData;
  config: Config;
}

export type CheckFn = (ctx: CheckContext) => CheckResult;
