import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI e2e", () => {
  it("should display help", () => {
    const output = execSync("node dist/index.js --help", { encoding: "utf-8" });
    expect(output).toContain("cmp");
    expect(output).toContain("check");
    expect(output).toContain("validate");
  });

  it("should display version", () => {
    const output = execSync("node dist/index.js --version", { encoding: "utf-8" });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should validate config file", () => {
    const output = execSync("node dist/index.js validate", { encoding: "utf-8" });
    expect(output).toContain("Config is valid");
  });

  it("should fail check without required options", () => {
    try {
      execSync("node dist/index.js check", { encoding: "utf-8" });
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as Error).message).toContain("required option");
    }
  });
});
