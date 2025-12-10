import { readFileSync, existsSync } from "fs";
import { parse } from "@iarna/toml";
import { Config, DEFAULT_CONFIG } from "./schema.js";
import { validateConfig } from "./validator.js";

const CONFIG_FILENAME = "cmp.toml";

export class ConfigNotFoundError extends Error {
  constructor(path: string) {
    super(`Config file not found: ${path}`);
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigParseError extends Error {
  constructor(message: string) {
    super(`Failed to parse config: ${message}`);
    this.name = "ConfigParseError";
  }
}

export function findConfigPath(startDir: string = process.cwd()): string | null {
  const configPath = `${startDir}/${CONFIG_FILENAME}`;
  if (existsSync(configPath)) {
    return configPath;
  }
  return null;
}

export function loadConfig(configPath?: string): Config {
  const path = configPath ?? findConfigPath();

  if (!path) {
    // Return default config if no config file found
    return DEFAULT_CONFIG;
  }

  if (!existsSync(path)) {
    throw new ConfigNotFoundError(path);
  }

  try {
    const content = readFileSync(path, "utf-8");
    const parsed = parse(content) as Partial<Config>;

    // Validate against JSON schema (throws ConfigValidationError if invalid)
    validateConfig(parsed);

    // Merge with defaults
    return {
      settings: {
        ...DEFAULT_CONFIG.settings,
        ...parsed.settings,
      },
      pr: {
        ...DEFAULT_CONFIG.pr,
        ...parsed.pr,
      },
      branch: {
        ...DEFAULT_CONFIG.branch,
        ...parsed.branch,
      },
      ticket: {
        ...DEFAULT_CONFIG.ticket,
        ...parsed.ticket,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw validation errors as-is
      if (error.name === "ConfigValidationError") {
        throw error;
      }
      throw new ConfigParseError(error.message);
    }
    throw new ConfigParseError("Unknown error");
  }
}
