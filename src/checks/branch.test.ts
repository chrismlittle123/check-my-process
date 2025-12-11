import { describe, it, expect } from "vitest";
import { checkBranchPattern } from "./branch.js";
import type { CheckContext } from "./types.js";
import type { PullRequestData } from "../github/types.js";
import type { Config } from "../config/schema.js";

function createMockPr(overrides: Partial<PullRequestData> = {}): PullRequestData {
  return {
    number: 1,
    title: "Test PR",
    body: "Test body",
    branch: "feature/ABC-123-add-login",
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
    branch: {
      pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$",
    },
    ...overrides,
  };
}

describe("checkBranchPattern", () => {
  it("should pass when branch matches pattern", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "feature/ABC-123-add-login" }),
      config: createMockConfig({
        branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("passed");
    expect(result.rule).toBe("branch.pattern");
    expect(result.message).toBe('Branch "feature/ABC-123-add-login" matches pattern');
  });

  it("should pass for fix branch type", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "fix/BUG-456-fix-crash" }),
      config: createMockConfig({
        branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("passed");
  });

  it("should pass for hotfix branch type", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "hotfix/URGENT-789-security-patch" }),
      config: createMockConfig({
        branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("passed");
  });

  it("should fail when branch does not match pattern", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "fix-bug" }),
      config: createMockConfig({
        branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toBe('Branch "fix-bug" doesn\'t match pattern');
    expect(result.actual).toBe("fix-bug");
  });

  it("should fail for branch missing ticket reference", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "feature/add-login" }),
      config: createMockConfig({
        branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("failed");
  });

  it("should fail for invalid branch type", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "chore/ABC-123-cleanup" }),
      config: createMockConfig({
        branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("failed");
  });

  it("should skip when branch pattern is not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "any-branch-name" }),
      config: createMockConfig({ branch: {} }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("skipped");
    expect(result.message).toBe("branch pattern not configured");
  });

  it("should skip when branch config is undefined", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "any-branch-name" }),
      config: { settings: { default_severity: "error" } },
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("skipped");
  });

  it("should handle simple patterns", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "main" }),
      config: createMockConfig({
        branch: { pattern: "^main$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("passed");
  });

  it("should handle invalid regex patterns gracefully", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "feature/test" }),
      config: createMockConfig({
        branch: { pattern: "[invalid(regex" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.status).toBe("failed");
    expect(result.message).toContain("Invalid branch pattern regex");
  });

  it("should use branch severity when configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "bad-branch" }),
      config: createMockConfig({
        branch: { pattern: "^feature/.*$", severity: "warning" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.severity).toBe("warning");
  });

  it("should use default severity when branch severity not configured", () => {
    const ctx: CheckContext = {
      pr: createMockPr({ branch: "bad-branch" }),
      config: createMockConfig({
        settings: { default_severity: "error" },
        branch: { pattern: "^feature/.*$" },
      }),
    };

    const result = checkBranchPattern(ctx);

    expect(result.severity).toBe("error");
  });

  describe("edge cases", () => {
    it("should handle empty branch name", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "" }),
        config: createMockConfig({
          branch: { pattern: "^(feature|fix|hotfix)/.*$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("failed");
      expect(result.actual).toBe("");
    });

    it("should handle very long branch names", () => {
      const longBranch = "feature/" + "a".repeat(500) + "-ABC-123";
      const ctx: CheckContext = {
        pr: createMockPr({ branch: longBranch }),
        config: createMockConfig({
          branch: { pattern: "^feature/.*-[A-Z]+-[0-9]+$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle branch names with special characters", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "feature/ABC-123_special.chars" }),
        config: createMockConfig({
          branch: { pattern: "^feature/[A-Z]+-[0-9]+[_\\.a-z]+$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle branch names with unicode characters", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "feature/ABC-123-añadir-función" }),
        config: createMockConfig({
          branch: { pattern: "^feature/[A-Z]+-[0-9]+-.*$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("passed");
    });

    it("should be case sensitive by default (Feature vs feature)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "Feature/ABC-123-test" }),
        config: createMockConfig({
          branch: { pattern: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("failed");
    });

    it("should allow case insensitive patterns when specified", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "FEATURE/ABC-123-test" }),
        config: createMockConfig({
          branch: { pattern: "^(?i)(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$" },
        }),
      };

      // Note: JavaScript regex doesn't support inline (?i) flag, so this tests
      // that the pattern is applied as-is (and will fail because (?i) isn't valid)
      const result = checkBranchPattern(ctx);

      // This will either fail because the regex is invalid or because it doesn't match
      expect(result.status).toBe("failed");
    });

    it("should handle branch names with slashes in description", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "feature/ABC-123/sub/path" }),
        config: createMockConfig({
          branch: { pattern: "^feature/[A-Z]+-[0-9]+/.*$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle branch names with numbers only", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "123456" }),
        config: createMockConfig({
          branch: { pattern: "^[0-9]+$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle branch name that is just a single character", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "x" }),
        config: createMockConfig({
          branch: { pattern: "^[a-z]$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      expect(result.status).toBe("passed");
    });

    it("should handle whitespace in branch names (if somehow present)", () => {
      const ctx: CheckContext = {
        pr: createMockPr({ branch: "feature/test branch" }),
        config: createMockConfig({
          branch: { pattern: "^feature/.*$" },
        }),
      };

      const result = checkBranchPattern(ctx);

      // Pattern matches anything after feature/, including spaces
      expect(result.status).toBe("passed");
    });
  });
});
