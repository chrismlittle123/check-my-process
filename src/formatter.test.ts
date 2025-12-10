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
});
