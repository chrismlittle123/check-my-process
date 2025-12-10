import { describe, it, expect } from "vitest";
import { loadConfig, ConfigNotFoundError } from "./loader.js";
import { DEFAULT_CONFIG } from "./schema.js";

describe("Config Loader", () => {
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
});
