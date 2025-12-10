import { describe, it, expect } from "vitest";
import { checkMinApprovals } from "./approvals.js";
import type { CheckContext } from "./types.js";
import type { PullRequestData } from "../github/types.js";
import type { Config } from "../config/schema.js";

function createMockPr(overrides: Partial<PullRequestData> = {}): PullRequestData {
  return {
    number: 1,
    title: "Test PR",
    body: "Test body",
    branch: "feature/test",
    baseBranch: "main",
    author: "testuser",
    filesChanged: 5,
    additions: 100,
    deletions: 50,
    approvalCount: 0,
    reviewers: [],
    ...overrides,
  };
}

function createMockConfig(overrides: Partial<Config> = {}): Config {
  return {
    settings: { default_severity: "error" },
    pr: {
      max_files: 20,
      max_lines: 400,
      min_approvals: 1,
    },
    ...overrides,
  };
}

describe("checkMinApprovals", () => {
  it("should pass when approvals meet minimum", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 2 }),
      config: createMockConfig({ pr: { min_approvals: 2 } }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.status).toBe("passed");
    expect(result.rule).toBe("pr.min_approvals");
    expect(result.message).toBe("2 approvals (min: 2)");
    expect(result.actual).toBe(2);
    expect(result.expected).toBe(2);
  });

  it("should pass when approvals exceed minimum", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 3 }),
      config: createMockConfig({ pr: { min_approvals: 2 } }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("3 approvals (min: 2)");
  });

  it("should fail when approvals are below minimum", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 1 }),
      config: createMockConfig({ pr: { min_approvals: 2 } }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe("1 approvals, need 2");
    expect(result.actual).toBe(1);
    expect(result.expected).toBe(2);
  });

  it("should fail when no approvals and minimum is 1", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 0 }),
      config: createMockConfig({ pr: { min_approvals: 1 } }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe("0 approvals, need 1");
  });

  it("should pass when no approvals required", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 0 }),
      config: createMockConfig({ pr: { min_approvals: 0 } }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.status).toBe("passed");
    expect(result.message).toBe("0 approvals (min: 0)");
  });

  it("should skip when min_approvals is not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 0 }),
      config: createMockConfig({ pr: {} }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.status).toBe("skipped");
    expect(result.message).toBe("min_approvals not configured");
  });

  it("should use pr severity when configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 0 }),
      config: createMockConfig({
        pr: { min_approvals: 2, severity: "warning" },
      }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.severity).toBe("warning");
  });

  it("should use default severity when pr severity not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ approvalCount: 0 }),
      config: createMockConfig({
        settings: { default_severity: "error" },
        pr: { min_approvals: 2 },
      }),
    };

    const result = checkMinApprovals(ctx);

    expect(result.severity).toBe("error");
  });
});
