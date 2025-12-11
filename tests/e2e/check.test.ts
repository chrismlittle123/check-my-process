import { describe, it, expect } from "vitest";
import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";

/**
 * E2E tests for the `check` command against real PRs in check-my-process-testing.
 *
 * These tests run against permanent test fixtures (open PRs) in the
 * chrismlittle123/check-my-process-testing repository.
 *
 * See docs/TEST_PRS_CREATED.md for details on each PR fixture.
 *
 * Requirements:
 * - GITHUB_TOKEN environment variable must be set
 * - The test PRs must remain open in the testing repository
 */

const TEST_REPO = "chrismlittle123/check-my-process-testing";
const CLI = "node dist/index.js";

// Skip these tests if GITHUB_TOKEN is not available
const hasGitHubToken = !!process.env.GITHUB_TOKEN;

interface CheckResult {
  rule: string;
  status: "passed" | "failed" | "skipped";
  message?: string;
  expected?: string | number;
  actual?: string | number;
  severity?: string;
}

interface CheckOutput {
  version: string;
  repo: string;
  pr: number;
  passed: number;
  failed: number;
  skipped: number;
  results: CheckResult[];
}

const execOptions: ExecSyncOptionsWithStringEncoding = {
  encoding: "utf-8",
  stdio: "pipe",
};

describe.skipIf(!hasGitHubToken)("check command with real PRs", () => {
  /**
   * PR #1: All Checks Should Pass (except approvals - needs manual approval)
   *
   * Branch: feature/v1.0.0/add-user-authentication ✓
   * Ticket: LIN-123 in title ✓
   * Files: 2 (max: 20) ✓
   * Lines: 435 (max: 400) - Actually exceeds limit
   * Approvals: 0 (needs 1 for full pass)
   *
   * Note: This PR currently fails due to lines > 400 and no approvals
   */
  it("PR #1: should fail due to lines exceeding limit and no approvals", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 1 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.max_lines",
            status: "failed",
          }),
          expect.objectContaining({
            rule: "pr.min_approvals",
            status: "failed",
          }),
        ])
      );
    }
  });

  /**
   * PR #2: Fails Branch Naming
   *
   * Branch: fix-login-bug ✗ (should be fix/vX.X.X/...)
   * Ticket: LIN-456 in title ✓
   * Files: 1 (max: 20) ✓
   * Lines: 1 (max: 400) ✓
   * Approvals: 0 (min: 1) ✗
   */
  it("PR #2: should fail branch naming check", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 2 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "branch.pattern",
            status: "failed",
          }),
        ])
      );

      // Verify ticket check passes
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "ticket.pattern",
            status: "passed",
          }),
        ])
      );
    }
  });

  /**
   * PR #3: Fails Ticket Reference
   *
   * Branch: feature/v1.0.0/add-logging ✓
   * Ticket: None ✗ (no LIN-XXX found)
   * Files: 1 (max: 20) ✓
   * Lines: 1 (max: 400) ✓
   * Approvals: 0 (min: 1) ✗
   */
  it("PR #3: should fail ticket reference check", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 3 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "ticket.pattern",
            status: "failed",
          }),
        ])
      );

      // Verify branch check passes
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "branch.pattern",
            status: "passed",
          }),
        ])
      );
    }
  });

  /**
   * PR #4: Fails Max Files Check
   *
   * Branch: feature/v1.0.0/bulk-components ✓
   * Ticket: LIN-789 in title ✓
   * Files: 25 (max: 20) ✗
   * Lines: 25 (max: 400) ✓
   * Approvals: 0 (min: 1) ✗
   */
  it("PR #4: should fail max files check", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 4 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.max_files",
            status: "failed",
          }),
        ])
      );

      // Verify branch and ticket checks pass
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "branch.pattern",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "ticket.pattern",
            status: "passed",
          }),
        ])
      );
    }
  });

  /**
   * PR #5: Fails Max Lines Check
   *
   * Branch: feature/v1.0.0/large-dataset ✓
   * Ticket: LIN-101 in title ✓
   * Files: 1 (max: 20) ✓
   * Lines: 453 (max: 400) ✗
   * Approvals: 0 (min: 1) ✗
   */
  it("PR #5: should fail max lines check", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 5 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.max_lines",
            status: "failed",
          }),
        ])
      );

      // Verify file count check passes
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.max_files",
            status: "passed",
          }),
        ])
      );
    }
  });

  /**
   * PR #6: Fails Approvals Check Only
   *
   * Branch: feature/v1.0.0/quick-fix ✓
   * Ticket: LIN-202 in title ✓
   * Files: 1 (max: 20) ✓
   * Lines: 1 (max: 400) ✓
   * Approvals: 0 (min: 1) ✗
   */
  it("PR #6: should fail only approvals check", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 6 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);

      // Only 1 failure (approvals)
      expect(result.failed).toBe(1);

      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.min_approvals",
            status: "failed",
          }),
        ])
      );

      // Verify all other checks pass
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "branch.pattern",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "ticket.pattern",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "pr.max_files",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "pr.max_lines",
            status: "passed",
          }),
        ])
      );
    }
  });

  /**
   * PR #7: Multiple Failures
   *
   * Branch: bad-branch-no-ticket ✗
   * Ticket: None ✗
   * Files: 25 (max: 20) ✗
   * Lines: 25 (max: 400) ✓
   * Approvals: 0 (min: 1) ✗
   */
  it("PR #7: should fail multiple checks", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 7 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);

      // Should have at least 4 failures: branch, ticket, files, approvals
      const failedChecks = result.results.filter((r) => r.status === "failed");
      expect(failedChecks.length).toBeGreaterThanOrEqual(4);

      // Verify specific failures
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "branch.pattern",
            status: "failed",
          }),
          expect.objectContaining({
            rule: "ticket.pattern",
            status: "failed",
          }),
          expect.objectContaining({
            rule: "pr.max_files",
            status: "failed",
          }),
          expect.objectContaining({
            rule: "pr.min_approvals",
            status: "failed",
          }),
        ])
      );

      // Lines should pass
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.max_lines",
            status: "passed",
          }),
        ])
      );
    }
  });

  /**
   * Test text output format
   */
  it("should output text format correctly", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 2 --format text`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const output = execError.stdout;
      expect(output).toContain("check-my-process");
      expect(output).toContain("PR #2");
      expect(output).toContain("[FAIL]");
      expect(output).toContain("branch.pattern");
    }
  });

  /**
   * Test that JSON output is valid and contains required fields
   */
  it("should output valid JSON with required fields", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 6 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };

      const result: CheckOutput = JSON.parse(execError.stdout);

      // Verify required fields exist
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("pr");
      expect(result.pr).toBe(6);
      expect(result).toHaveProperty("passed");
      expect(result).toHaveProperty("failed");
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
    }
  });

  /**
   * PR #8: All Checks Pass (except approvals - needs manual approval)
   *
   * Branch: feature/v1.0.0/LIN-300-passing-pr ✓
   * Ticket: LIN-300 in title and branch ✓
   * Files: 1 (max: 20) ✓
   * Lines: 8 (max: 400) ✓
   * Approvals: 0 (min: 1) ✗ - Cannot self-approve
   *
   * This PR passes all checks except approvals (which requires manual approval)
   */
  it("PR #8: should pass all checks except approvals", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 8 --format json`, execOptions);
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const execError = error as { status: number; stdout: string };
      expect(execError.status).toBe(1);

      const result: CheckOutput = JSON.parse(execError.stdout);

      // Only 1 failure (approvals)
      expect(result.failed).toBe(1);

      // Verify all non-approval checks pass
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "branch.pattern",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "ticket.pattern",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "pr.max_files",
            status: "passed",
          }),
          expect.objectContaining({
            rule: "pr.max_lines",
            status: "passed",
          }),
        ])
      );

      // Verify only approvals fails
      expect(result.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: "pr.min_approvals",
            status: "failed",
          }),
        ])
      );
    }
  });
});

/**
 * E2E tests for error scenarios
 */
describe.skipIf(!hasGitHubToken)("check command error handling", () => {
  /**
   * Test invalid repository format
   */
  it("should fail with invalid repo format", () => {
    try {
      execSync(`${CLI} check --repo invalid-repo --pr 1`, execOptions);
      expect.fail("Should have exited with error");
    } catch (error) {
      const execError = error as { status: number; stderr: string };
      expect(execError.status).toBe(1);
      expect(execError.stderr).toContain("owner/repo");
    }
  });

  /**
   * Test non-existent PR
   */
  it("should fail with non-existent PR", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO} --pr 99999`, execOptions);
      expect.fail("Should have exited with error");
    } catch (error) {
      const execError = error as { status: number; stderr: string };
      expect(execError.status).toBe(1);
    }
  });

  /**
   * Test missing required options
   */
  it("should fail when --repo is missing", () => {
    try {
      execSync(`${CLI} check --pr 1`, execOptions);
      expect.fail("Should have exited with error");
    } catch (error) {
      const execError = error as { status: number; stderr: string };
      expect(execError.status).toBe(1);
    }
  });

  /**
   * Test missing required options
   */
  it("should fail when --pr is missing", () => {
    try {
      execSync(`${CLI} check --repo ${TEST_REPO}`, execOptions);
      expect.fail("Should have exited with error");
    } catch (error) {
      const execError = error as { status: number; stderr: string };
      expect(execError.status).toBe(1);
    }
  });
});
