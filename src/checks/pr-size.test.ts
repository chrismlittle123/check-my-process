import { describe, it, expect } from "vitest";
import { checkMaxFiles, checkMaxLines } from "./pr-size.js";
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

describe("checkMaxFiles", () => {
  it("should pass when files changed is under limit", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ filesChanged: 10 }),
      config: createMockConfig({ pr: { max_files: 20 } }),
    };

    const result = checkMaxFiles(ctx);

    expect(result.status).toBe("passed");
    expect(result.rule).toBe("pr.max_files");
    expect(result.message).toBe("10 files (max: 20)");
    expect(result.actual).toBe(10);
    expect(result.expected).toBe(20);
  });

  it("should pass when files changed equals limit", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ filesChanged: 20 }),
      config: createMockConfig({ pr: { max_files: 20 } }),
    };

    const result = checkMaxFiles(ctx);

    expect(result.status).toBe("passed");
  });

  it("should fail when files changed exceeds limit", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ filesChanged: 25 }),
      config: createMockConfig({ pr: { max_files: 20 } }),
    };

    const result = checkMaxFiles(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe("25 files exceeds limit of 20");
    expect(result.actual).toBe(25);
    expect(result.expected).toBe(20);
  });

  it("should skip when max_files is not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ filesChanged: 100 }),
      config: createMockConfig({ pr: {} }),
    };

    const result = checkMaxFiles(ctx);

    expect(result.status).toBe("skipped");
    expect(result.message).toBe("max_files not configured");
  });

  it("should use pr severity when configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ filesChanged: 25 }),
      config: createMockConfig({
        pr: { max_files: 20, severity: "warning" },
      }),
    };

    const result = checkMaxFiles(ctx);

    expect(result.severity).toBe("warning");
  });

  it("should use default severity when pr severity not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ filesChanged: 25 }),
      config: createMockConfig({
        settings: { default_severity: "error" },
        pr: { max_files: 20 },
      }),
    };

    const result = checkMaxFiles(ctx);

    expect(result.severity).toBe("error");
  });
});

describe("checkMaxLines", () => {
  it("should pass when total lines is under limit", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ additions: 100, deletions: 50 }),
      config: createMockConfig({ pr: { max_lines: 400 } }),
    };

    const result = checkMaxLines(ctx);

    expect(result.status).toBe("passed");
    expect(result.rule).toBe("pr.max_lines");
    expect(result.message).toBe("150 lines (max: 400)");
    expect(result.actual).toBe(150);
    expect(result.expected).toBe(400);
  });

  it("should pass when total lines equals limit", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ additions: 300, deletions: 100 }),
      config: createMockConfig({ pr: { max_lines: 400 } }),
    };

    const result = checkMaxLines(ctx);

    expect(result.status).toBe("passed");
  });

  it("should fail when total lines exceeds limit", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ additions: 400, deletions: 100 }),
      config: createMockConfig({ pr: { max_lines: 400 } }),
    };

    const result = checkMaxLines(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe("500 lines exceeds limit of 400");
    expect(result.actual).toBe(500);
    expect(result.expected).toBe(400);
  });

  it("should skip when max_lines is not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ additions: 1000, deletions: 500 }),
      config: createMockConfig({ pr: {} }),
    };

    const result = checkMaxLines(ctx);

    expect(result.status).toBe("skipped");
    expect(result.message).toBe("max_lines not configured");
  });

  it("should count both additions and deletions", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ additions: 200, deletions: 201 }),
      config: createMockConfig({ pr: { max_lines: 400 } }),
    };

    const result = checkMaxLines(ctx);

    expect(result.status).toBe("failed");
    expect(result.actual).toBe(401);
  });

  it("should use pr severity when configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ additions: 500, deletions: 0 }),
      config: createMockConfig({
        pr: { max_lines: 400, severity: "warning" },
      }),
    };

    const result = checkMaxLines(ctx);

    expect(result.severity).toBe("warning");
  });
});
