import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const TEST_DIR = join(process.cwd(), "tests/e2e/fixtures");
const TEST_CONFIG = join(TEST_DIR, "test-cmp.toml");

describe("CLI e2e", () => {
  beforeAll(() => {
    // Create test fixtures directory
    mkdirSync(TEST_DIR, { recursive: true });

    // Create a test config file
    writeFileSync(
      TEST_CONFIG,
      `[settings]
default_severity = "error"

[pr]
max_files = 20
max_lines = 400
min_approvals = 1

[branch]
pattern = "^(feature|fix|hotfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$"

[ticket]
pattern = "[A-Z]+-[0-9]+"
check_in = ["title", "branch", "body"]
`
    );
  });

  afterAll(() => {
    // Clean up test files
    try {
      unlinkSync(TEST_CONFIG);
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("help and version", () => {
    it("should display help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("cmp");
      expect(output).toContain("check");
      expect(output).toContain("validate");
      expect(output).toContain("init");
    });

    it("should display version", () => {
      const output = execSync("node dist/index.js --version", {
        encoding: "utf-8",
      });
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("should display check command help", () => {
      const output = execSync("node dist/index.js check --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("--repo");
      expect(output).toContain("--pr");
      expect(output).toContain("--format");
      expect(output).toContain("--config");
    });
  });

  describe("validate command", () => {
    it("should validate config file", () => {
      const output = execSync("node dist/index.js validate", {
        encoding: "utf-8",
      });
      expect(output).toContain("Config is valid");
    });

    it("should validate custom config file", () => {
      const output = execSync(`node dist/index.js validate --config ${TEST_CONFIG}`, {
        encoding: "utf-8",
      });
      expect(output).toContain("Config is valid");
      expect(output).toContain("max_files: 20");
      expect(output).toContain("max_lines: 400");
    });

    it("should fail for non-existent config file", () => {
      try {
        execSync("node dist/index.js validate --config nonexistent.toml", {
          encoding: "utf-8",
          stdio: "pipe",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("not found");
      }
    });

    it("should display branch pattern in validate output", () => {
      const output = execSync(`node dist/index.js validate --config ${TEST_CONFIG}`, {
        encoding: "utf-8",
      });
      expect(output).toContain("Branch rules:");
      expect(output).toContain("pattern:");
    });

    it("should display ticket pattern in validate output", () => {
      const output = execSync(`node dist/index.js validate --config ${TEST_CONFIG}`, {
        encoding: "utf-8",
      });
      expect(output).toContain("Ticket rules:");
      expect(output).toContain("check_in:");
    });
  });

  describe("check command argument validation", () => {
    it("should fail check without required options", () => {
      try {
        execSync("node dist/index.js check", {
          encoding: "utf-8",
          stdio: "pipe",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("required option");
      }
    });

    it("should fail check without --repo", () => {
      try {
        execSync("node dist/index.js check --pr 1", {
          encoding: "utf-8",
          stdio: "pipe",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("--repo");
      }
    });

    it("should fail check without --pr", () => {
      try {
        execSync("node dist/index.js check --repo owner/repo", {
          encoding: "utf-8",
          stdio: "pipe",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("--pr");
      }
    });

    it("should fail without GITHUB_TOKEN", () => {
      try {
        execSync("node dist/index.js check --repo owner/repo --pr 1", {
          encoding: "utf-8",
          stdio: "pipe",
          env: { ...process.env, GITHUB_TOKEN: "" },
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("GITHUB_TOKEN");
      }
    });

    it("should fail with invalid repo format", () => {
      try {
        execSync("node dist/index.js check --repo invalid --pr 1", {
          encoding: "utf-8",
          stdio: "pipe",
          env: { ...process.env, GITHUB_TOKEN: "test-token" },
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("owner/repo");
      }
    });
  });

  describe("init command", () => {
    it("should display init message", () => {
      const output = execSync("node dist/index.js init", { encoding: "utf-8" });
      expect(output).toContain("coming");
    });
  });
});
