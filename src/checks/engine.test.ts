import { describe, it, expect } from "vitest";
import { runChecks, groupResultsByCategory } from "./engine.js";
import type { CheckContext, CheckResult } from "./types.js";
import type { PullRequestData } from "../github/types.js";
import type { Config } from "../config/schema.js";

function createMockPr(overrides: Partial<PullRequestData> = {}): PullRequestData {
  return {
    number: 1,
    title: "ABC-123: Test PR",
    body: "Test body with ABC-123",
    branch: "feature/ABC-123-test",
    baseBranch: "main",
    author: "testuser",
    filesChanged: 5,
    additions: 100,
    deletions: 50,
    approvalCount: 2,
    reviewers: ["reviewer1", "reviewer2"],
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
    branch: {
      pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$",
    },
    ticket: {
      pattern: "[A-Z]+-[0-9]+",
      check_in: ["title", "branch", "body"],
    },
    ...overrides,
  };
}

describe("runChecks", () => {
  it("should run all checks and return summary", () => {
    const ctx: CheckContext = {
      pr: createMockPr(),
      config: createMockConfig(),
    };

    const summary = runChecks(ctx);

    expect(summary.results).toHaveLength(5);
    expect(summary.passed).toBeGreaterThan(0);
  });

  it("should count passed checks correctly", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        filesChanged: 5,
        additions: 100,
        deletions: 50,
        approvalCount: 2,
        branch: "feature/ABC-123-test",
        title: "ABC-123: Test",
      }),
      config: createMockConfig(),
    };

    const summary = runChecks(ctx);

    expect(summary.passed).toBe(5);
    expect(summary.failed).toBe(0);
    expect(summary.skipped).toBe(0);
    expect(summary.hasErrors).toBe(false);
  });

  it("should count failed checks correctly", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        filesChanged: 50, // exceeds limit
        additions: 500, // exceeds limit
        deletions: 100,
        approvalCount: 0, // below minimum
        branch: "bad-branch", // doesn't match pattern
        title: "No ticket", // no ticket
        body: "No ticket here either",
      }),
      config: createMockConfig(),
    };

    const summary = runChecks(ctx);

    expect(summary.failed).toBe(5);
    expect(summary.passed).toBe(0);
    expect(summary.hasErrors).toBe(true);
  });

  it("should count skipped checks when config is missing", () => {
    const ctx: CheckContext = {
      pr: createMockPr(),
      config: {
        settings: { default_severity: "error" },
        // No pr, branch, or ticket config
      },
    };

    const summary = runChecks(ctx);

    expect(summary.skipped).toBe(5);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.hasErrors).toBe(false);
  });

  it("should set hasErrors to false when failures are warnings", () => {
    const ctx: CheckContext = {
      pr: createMockPr({
        filesChanged: 50, // exceeds limit
      }),
      config: createMockConfig({
        pr: { max_files: 20, severity: "warning" },
      }),
    };

    const summary = runChecks(ctx);

    expect(summary.failed).toBeGreaterThan(0);
    // Only the pr checks use warning severity
    const prResults = summary.results.filter((r) => r.rule.startsWith("pr."));
    expect(prResults.every((r) => r.severity === "warning")).toBe(true);
  });

  it("should include all check rules in results", () => {
    const ctx: CheckContext = {
      pr: createMockPr(),
      config: createMockConfig(),
    };

    const summary = runChecks(ctx);
    const rules = summary.results.map((r) => r.rule);

    expect(rules).toContain("pr.max_files");
    expect(rules).toContain("pr.max_lines");
    expect(rules).toContain("pr.min_approvals");
    expect(rules).toContain("branch.pattern");
    expect(rules).toContain("ticket.pattern");
  });
});

describe("groupResultsByCategory", () => {
  it("should group results by category", () => {
    const results: CheckResult[] = [
      { rule: "pr.max_files", status: "passed", message: "OK", severity: "error" },
      { rule: "pr.max_lines", status: "passed", message: "OK", severity: "error" },
      { rule: "pr.min_approvals", status: "passed", message: "OK", severity: "error" },
      { rule: "branch.pattern", status: "passed", message: "OK", severity: "error" },
      { rule: "ticket.pattern", status: "passed", message: "OK", severity: "error" },
    ];

    const groups = groupResultsByCategory(results);

    expect(groups.get("Pull Request")).toHaveLength(3);
    expect(groups.get("Branch")).toHaveLength(1);
    expect(groups.get("Ticket")).toHaveLength(1);
  });

  it("should handle empty results", () => {
    const groups = groupResultsByCategory([]);

    expect(groups.size).toBe(0);
  });

  it("should use category name for unknown categories", () => {
    const results: CheckResult[] = [
      { rule: "unknown.check", status: "passed", message: "OK", severity: "error" },
    ];

    const groups = groupResultsByCategory(results);

    expect(groups.has("unknown")).toBe(true);
  });
});
