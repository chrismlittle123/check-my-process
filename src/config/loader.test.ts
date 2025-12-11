import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadConfig, ConfigNotFoundError, ConfigParseError } from "./loader.js";
import { DEFAULT_CONFIG } from "./schema.js";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const TEST_DIR = join(process.cwd(), "src/config/test-fixtures");

describe("Config Loader", () => {
  beforeAll(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should throw ConfigNotFoundError when config path doesn't exist", () => {
    expect(() => loadConfig("/nonexistent/path/cmp.toml")).toThrow(ConfigNotFoundError);
  });

  it("should have correct default values", () => {
    expect(DEFAULT_CONFIG.settings.default_severity).toBe("error");
    expect(DEFAULT_CONFIG.pr?.max_files).toBe(20);
    expect(DEFAULT_CONFIG.pr?.max_lines).toBe(400);
    expect(DEFAULT_CONFIG.pr?.min_approvals).toBe(1);
  });

  it("should load config from cmp.toml in project root", () => {
    const config = loadConfig();
    expect(config.settings.default_severity).toBe("error");
    expect(config.pr?.max_files).toBe(20);
  });

  describe("invalid TOML syntax", () => {
    it("should throw ConfigParseError for malformed TOML", () => {
      const invalidToml = join(TEST_DIR, "invalid.toml");
      writeFileSync(invalidToml, "this is not [valid toml =");

      expect(() => loadConfig(invalidToml)).toThrow(ConfigParseError);
    });

    it("should throw ConfigParseError with position info for syntax errors", () => {
      const invalidToml = join(TEST_DIR, "syntax-error.toml");
      writeFileSync(
        invalidToml,
        `[settings]
default_severity = "error"
[pr
max_files = 20`
      );

      try {
        loadConfig(invalidToml);
        expect.fail("Should have thrown ConfigParseError");
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigParseError);
        expect((error as Error).message).toContain("Invalid TOML syntax");
      }
    });

    it("should throw ConfigParseError for unclosed strings", () => {
      const invalidToml = join(TEST_DIR, "unclosed-string.toml");
      writeFileSync(invalidToml, '[settings]\ndefault_severity = "error');

      expect(() => loadConfig(invalidToml)).toThrow(ConfigParseError);
    });

    it("should throw ConfigParseError for invalid values", () => {
      const invalidToml = join(TEST_DIR, "invalid-value.toml");
      writeFileSync(
        invalidToml,
        `[settings]
default_severity = error_without_quotes`
      );

      expect(() => loadConfig(invalidToml)).toThrow(ConfigParseError);
    });
  });

  describe("file system edge cases", () => {
    it("should throw ConfigParseError when path is a directory", () => {
      const dirPath = join(TEST_DIR, "subdir");
      mkdirSync(dirPath, { recursive: true });

      expect(() => loadConfig(dirPath)).toThrow(ConfigParseError);
      try {
        loadConfig(dirPath);
      } catch (error) {
        expect((error as Error).message).toContain("is a directory");
      }
    });

    it("should throw ConfigValidationError for empty config file (missing required settings)", () => {
      const emptyToml = join(TEST_DIR, "empty.toml");
      writeFileSync(emptyToml, "");

      // Empty TOML is valid TOML but fails schema validation (missing required 'settings')
      expect(() => loadConfig(emptyToml)).toThrow();
      try {
        loadConfig(emptyToml);
      } catch (error) {
        expect((error as Error).name).toBe("ConfigValidationError");
        expect((error as Error).message).toContain("settings");
      }
    });
  });
});
