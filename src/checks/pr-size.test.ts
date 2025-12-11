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

describe("PR size edge cases", () => {
  describe("checkMaxFiles boundary values", () => {
    it("should pass when PR has 0 files changed", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 0 }),
        config: createMockConfig({ pr: { max_files: 20 } }),
      };

      const result = checkMaxFiles(ctx);

      expect(result.status).toBe("passed");
      expect(result.actual).toBe(0);
    });

    it("should pass when PR has exactly 1 file (minimum non-empty PR)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 1 }),
        config: createMockConfig({ pr: { max_files: 1 } }),
      };

      const result = checkMaxFiles(ctx);

      expect(result.status).toBe("passed");
      expect(result.actual).toBe(1);
    });

    it("should fail when 1 file exceeds limit of 0", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 1 }),
        config: createMockConfig({ pr: { max_files: 0 } }),
      };

      const result = checkMaxFiles(ctx);

      // Note: 0 is typically not a useful limit, but the check should handle it
      expect(result.status).toBe("failed");
    });

    it("should handle very large file counts", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 10000 }),
        config: createMockConfig({ pr: { max_files: 20 } }),
      };

      const result = checkMaxFiles(ctx);

      expect(result.status).toBe("failed");
      expect(result.actual).toBe(10000);
      expect(result.message).toBe("10000 files exceeds limit of 20");
    });

    it("should pass when files equal very large limit", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 1000 }),
        config: createMockConfig({ pr: { max_files: 1000 } }),
      };

      const result = checkMaxFiles(ctx);

      expect(result.status).toBe("passed");
    });

    it("should fail when one file over limit", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 21 }),
        config: createMockConfig({ pr: { max_files: 20 } }),
      };

      const result = checkMaxFiles(ctx);

      expect(result.status).toBe("failed");
      expect(result.actual).toBe(21);
    });
  });

  describe("checkMaxLines boundary values", () => {
    it("should pass when PR has 0 lines changed", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 0, deletions: 0 }),
        config: createMockConfig({ pr: { max_lines: 400 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("passed");
      expect(result.actual).toBe(0);
    });

    it("should pass when PR has only additions (no deletions)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 100, deletions: 0 }),
        config: createMockConfig({ pr: { max_lines: 400 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("passed");
      expect(result.actual).toBe(100);
    });

    it("should pass when PR has only deletions (no additions)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 0, deletions: 200 }),
        config: createMockConfig({ pr: { max_lines: 400 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("passed");
      expect(result.actual).toBe(200);
    });

    it("should fail when 1 line exceeds limit of 0", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 1, deletions: 0 }),
        config: createMockConfig({ pr: { max_lines: 0 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("failed");
    });

    it("should handle very large line counts", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 50000, deletions: 50000 }),
        config: createMockConfig({ pr: { max_lines: 400 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("failed");
      expect(result.actual).toBe(100000);
      expect(result.message).toBe("100000 lines exceeds limit of 400");
    });

    it("should fail when one line over limit", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 201, deletions: 200 }),
        config: createMockConfig({ pr: { max_lines: 400 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("failed");
      expect(result.actual).toBe(401);
    });

    it("should pass with exactly 1 addition and 1 deletion under limit", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 1, deletions: 1 }),
        config: createMockConfig({ pr: { max_lines: 2 } }),
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("passed");
      expect(result.actual).toBe(2);
    });
  });

  describe("config edge cases", () => {
    it("should skip max_files when pr config is undefined", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ filesChanged: 100 }),
        config: { settings: { default_severity: "error" } },
      };

      const result = checkMaxFiles(ctx);

      expect(result.status).toBe("skipped");
    });

    it("should skip max_lines when pr config is undefined", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ additions: 1000, deletions: 1000 }),
        config: { settings: { default_severity: "error" } },
      };

      const result = checkMaxLines(ctx);

      expect(result.status).toBe("skipped");
    });
  });
});
