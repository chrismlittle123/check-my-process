import { describe, it, expect } from "vitest";
import { createCli } from "./cli.js";

describe("CLI", () => {
  it("should create a CLI program", () => {
    const program = createCli();
    expect(program.name()).toBe("cmp");
  });

  it("should have check command", () => {
    const program = createCli();
    const checkCmd = program.commands.find((cmd) => cmd.name() === "check");
    expect(checkCmd).toBeDefined();
  });

  it("should have validate command", () => {
    const program = createCli();
    const validateCmd = program.commands.find((cmd) => cmd.name() === "validate");
    expect(validateCmd).toBeDefined();
  });

  it("should have init command", () => {
    const program = createCli();
    const initCmd = program.commands.find((cmd) => cmd.name() === "init");
    expect(initCmd).toBeDefined();
  });
});
