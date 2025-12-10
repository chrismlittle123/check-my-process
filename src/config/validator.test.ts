import { describe, it, expect } from "vitest";
import { validateConfig, getValidationErrors, ConfigValidationError } from "./validator.js";

describe("Config Validator", () => {
  describe("validateConfig", () => {
    it("should accept a valid minimal config", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
      };
      expect(validateConfig(config)).toBe(true);
    });

    it("should accept a valid full config", () => {
      const config = {
        settings: {
          default_severity: "warning",
        },
        pr: {
          max_files: 10,
          max_lines: 200,
          min_approvals: 2,
          severity: "error",
        },
        branch: {
          pattern: "^feature/.*$",
          severity: "warning",
        },
        ticket: {
          pattern: "JIRA-[0-9]+",
          check_in: ["title", "body"],
          severity: "error",
        },
      };
      expect(validateConfig(config)).toBe(true);
    });

    it("should reject config missing required settings", () => {
      const config = {};
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should reject config with invalid severity value", () => {
      const config = {
        settings: {
          default_severity: "invalid",
        },
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should reject config with invalid pr.max_files type", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
        pr: {
          max_files: "not-a-number",
        },
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should reject config with invalid ticket.check_in values", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
        ticket: {
          check_in: ["title", "invalid_location"],
        },
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should reject config with additional properties", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
        unknown_section: {
          some_value: true,
        },
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should reject config with negative max_files", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
        pr: {
          max_files: -5,
        },
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });

    it("should reject config with zero max_files", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
        pr: {
          max_files: 0,
        },
      };
      expect(() => validateConfig(config)).toThrow(ConfigValidationError);
    });
  });

  describe("getValidationErrors", () => {
    it("should return empty array for valid config", () => {
      const config = {
        settings: {
          default_severity: "error",
        },
      };
      expect(getValidationErrors(config)).toEqual([]);
    });

    it("should return errors for invalid config", () => {
      const config = {
        settings: {
          default_severity: "invalid",
        },
      };
      const errors = getValidationErrors(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].path).toContain("default_severity");
    });

    it("should return multiple errors when multiple fields are invalid", () => {
      const config = {
        settings: {
          default_severity: "invalid",
        },
        pr: {
          max_files: "not-a-number",
        },
      };
      const errors = getValidationErrors(config);
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe("ConfigValidationError", () => {
    it("should contain validation errors in the errors property", () => {
      const config = {
        settings: {
          default_severity: "invalid",
        },
      };
      try {
        validateConfig(config);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        if (error instanceof ConfigValidationError) {
          expect(error.errors.length).toBeGreaterThan(0);
          expect(error.message).toContain("Config validation failed");
        }
      }
    });
  });
});
