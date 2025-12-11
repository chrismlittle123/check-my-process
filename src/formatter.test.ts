import { describe, it, expect } from "vitest";
import { formatResults } from "./formatter.js";
import type { CheckSummary } from "./checks/index.js";

function createMockSummary(overrides: Partial<CheckSummary> = {}): CheckSummary {
  return {
    results: [
      {
        rule: "pr.max_files",
        status: "passed",
        message: "5 files (max: 20)",
        expected: 20,
        actual: 5,
        severity: "error",
      },
      {
        rule: "pr.max_lines",
        status: "passed",
        message: "150 lines (max: 400)",
        expected: 400,
        actual: 150,
        severity: "error",
      },
      {
        rule: "branch.pattern",
        status: "failed",
        message: 'Branch "fix-bug" doesn\'t match pattern',
        expected: "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$",
        actual: "fix-bug",
        severity: "error",
      },
    ],
    passed: 2,
    failed: 1,
    skipped: 0,
    hasErrors: true,
    ...overrides,
  };
}

describe("formatResults", () => {
  describe("JSON format", () => {
    it("should return valid JSON", () => {
      const summary = createMockSummary();
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed).toBeDefined();
    });

    it("should include version, repo, and PR number", () => {
      const summary = createMockSummary();
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe("1.1.0");
      expect(parsed.repo).toBe("owner/repo");
      expect(parsed.pr).toBe(123);
    });

    it("should include summary counts", () => {
      const summary = createMockSummary({
        passed: 4,
        failed: 1,
        skipped: 2,
      });
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.passed).toBe(4);
      expect(parsed.failed).toBe(1);
      expect(parsed.skipped).toBe(2);
    });

    it("should include all check results", () => {
      const summary = createMockSummary();
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.results).toHaveLength(3);
      expect(parsed.results[0].rule).toBe("pr.max_files");
      expect(parsed.results[0].status).toBe("passed");
    });
  });

  describe("text format", () => {
    it("should include version header", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("check-my-process v1.1.0");
    });

    it("should include PR info", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("Checking PR #123 in owner/repo");
    });

    it("should include category headers", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("Pull Request");
      expect(result).toContain("Branch");
    });

    it("should show passed checks with checkmark", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      // Check for the message content (checkmark may have color codes)
      expect(result).toContain("max_files: 5 files (max: 20)");
    });

    it("should show failed checks with X", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain('pattern: Branch "fix-bug" doesn\'t match pattern');
    });

    it("should show expected value for failed checks", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("Expected:");
    });

    it("should include summary line", () => {
      const summary = createMockSummary({
        passed: 4,
        failed: 1,
        skipped: 0,
      });
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("4 passed");
      expect(result).toContain("1 failed");
    });

    it("should show skipped count when present", () => {
      const summary = createMockSummary({
        passed: 3,
        failed: 0,
        skipped: 2,
      });
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("2 skipped");
    });
  });

  describe("edge cases", () => {
    it("should handle empty results array (JSON)", () => {
      const summary: CheckSummary = {
        results: [],
        passed: 0,
        failed: 0,
        skipped: 0,
        hasErrors: false,
      };
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.results).toHaveLength(0);
      expect(parsed.passed).toBe(0);
      expect(parsed.failed).toBe(0);
    });

    it("should handle empty results array (text)", () => {
      const summary: CheckSummary = {
        results: [],
        passed: 0,
        failed: 0,
        skipped: 0,
        hasErrors: false,
      };
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("check-my-process v1.1.0");
      expect(result).toContain("0 passed");
    });

    it("should handle special characters in PR title/branch (JSON)", () => {
      const summary = createMockSummary({
        results: [
          {
            rule: "branch.pattern",
            status: "failed",
            message: "Branch \"feature/<script>alert('xss')</script>\" doesn't match",
            expected: "^feature/.*$",
            actual: "feature/<script>alert('xss')</script>",
            severity: "error",
          },
        ],
      });
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      // JSON should properly escape special characters
      expect(parsed.results[0].actual).toBe("feature/<script>alert('xss')</script>");
    });

    it("should handle special characters in text output", () => {
      const summary = createMockSummary({
        results: [
          {
            rule: "branch.pattern",
            status: "failed",
            message: 'Branch "feature/test&branch" doesn\'t match',
            expected: "^feature/.*$",
            actual: "feature/test&branch",
            severity: "error",
          },
        ],
      });
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("test&branch");
    });

    it("should handle unicode characters in messages (JSON)", () => {
      const summary = createMockSummary({
        results: [
          {
            rule: "ticket.pattern",
            status: "passed",
            message: "Ticket ABC-123: Añadir función de búsqueda 日本語",
            severity: "error",
          },
        ],
        passed: 1,
        failed: 0,
      });
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.results[0].message).toContain("Añadir");
      expect(parsed.results[0].message).toContain("日本語");
    });

    it("should handle unicode characters in messages (text)", () => {
      const summary = createMockSummary({
        results: [
          {
            rule: "ticket.pattern",
            status: "passed",
            message: "Ticket ABC-123: Добавить функцию 中文",
            severity: "error",
          },
        ],
        passed: 1,
        failed: 0,
      });
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("Добавить");
      expect(result).toContain("中文");
    });

    it("should handle very long messages", () => {
      const longMessage = "A".repeat(1000);
      const summary = createMockSummary({
        results: [
          {
            rule: "branch.pattern",
            status: "failed",
            message: longMessage,
            expected: "^feature/.*$",
            actual: "bad-branch",
            severity: "error",
          },
        ],
      });
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain(longMessage);
    });

    it("should handle newlines in expected values", () => {
      const summary = createMockSummary({
        results: [
          {
            rule: "branch.pattern",
            status: "failed",
            message: "Branch doesn't match pattern",
            expected: "^(feature|fix|hotfix)/\n[A-Z]+-[0-9]+",
            actual: "bad-branch",
            severity: "error",
          },
        ],
      });
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.results[0].expected).toContain("\n");
    });

    it("should handle all checks passed (no failures)", () => {
      const summary: CheckSummary = {
        results: [
          {
            rule: "pr.max_files",
            status: "passed",
            message: "5 files (max: 20)",
            severity: "error",
          },
          {
            rule: "pr.max_lines",
            status: "passed",
            message: "100 lines (max: 400)",
            severity: "error",
          },
          {
            rule: "branch.pattern",
            status: "passed",
            message: "Branch matches",
            severity: "error",
          },
        ],
        passed: 3,
        failed: 0,
        skipped: 0,
        hasErrors: false,
      };
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("3 passed");
      expect(result).toContain("0 failed");
    });

    it("should handle all checks failed", () => {
      const summary: CheckSummary = {
        results: [
          {
            rule: "pr.max_files",
            status: "failed",
            message: "25 files exceeds 20",
            expected: 20,
            actual: 25,
            severity: "error",
          },
          {
            rule: "pr.max_lines",
            status: "failed",
            message: "500 lines exceeds 400",
            expected: 400,
            actual: 500,
            severity: "error",
          },
        ],
        passed: 0,
        failed: 2,
        skipped: 0,
        hasErrors: true,
      };
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("0 passed");
      expect(result).toContain("2 failed");
    });

    it("should handle all checks skipped", () => {
      const summary: CheckSummary = {
        results: [
          { rule: "pr.max_files", status: "skipped", message: "not configured", severity: "error" },
          {
            rule: "branch.pattern",
            status: "skipped",
            message: "not configured",
            severity: "error",
          },
        ],
        passed: 0,
        failed: 0,
        skipped: 2,
        hasErrors: false,
      };
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("0 passed");
      expect(result).toContain("2 skipped");
    });

    it("should handle repo name with special characters", () => {
      const summary = createMockSummary();
      const options = {
        format: "text" as const,
        version: "1.1.0",
        repo: "owner/repo-with-dashes_and_underscores.dots",
        prNumber: 123,
      };

      const result = formatResults(summary, options);

      expect(result).toContain("owner/repo-with-dashes_and_underscores.dots");
    });

    it("should handle very large PR number", () => {
      const summary = createMockSummary();
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 999999999,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.pr).toBe(999999999);
    });

    it("should handle warning severity in output", () => {
      const summary: CheckSummary = {
        results: [
          {
            rule: "pr.max_files",
            status: "failed",
            message: "25 files exceeds soft limit of 20",
            expected: 20,
            actual: 25,
            severity: "warning",
          },
        ],
        passed: 0,
        failed: 1,
        skipped: 0,
        hasErrors: false, // warnings don't count as errors
      };
      const options = {
        format: "json" as const,
        version: "1.1.0",
        repo: "owner/repo",
        prNumber: 123,
      };

      const result = formatResults(summary, options);
      const parsed = JSON.parse(result);

      expect(parsed.results[0].severity).toBe("warning");
      // Note: hasErrors is not included in JSON output, only in CheckSummary
      expect(parsed.failed).toBe(1);
    });
  });
});
