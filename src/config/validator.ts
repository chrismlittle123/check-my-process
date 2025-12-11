import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import type { Config } from "./schema.js";
import configSchema from "./cmp.schema.json" with { type: "json" };

export interface ValidationError {
  path: string;
  message: string;
}

export class ConfigValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const errorMessages = errors.map((e) => `  - ${e.path}: ${e.message}`).join("\n");
    super(`Config validation failed:\n${errorMessages}`);
    this.name = "ConfigValidationError";
    this.errors = errors;
  }
}

const ajv = new Ajv.default({
  allErrors: true,
  verbose: true,
});
addFormats.default(ajv);

const validate = ajv.compile(configSchema);

export function validateConfig(config: unknown): config is Config {
  const valid = validate(config);
  if (!valid && validate.errors) {
    const errors: ValidationError[] = validate.errors.map((error: ErrorObject) => {
      let message = error.message || "Unknown validation error";

      // Enhance "additionalProperties" errors to include the property name
      if (
        error.keyword === "additionalProperties" &&
        error.params &&
        "additionalProperty" in error.params
      ) {
        const propName = error.params.additionalProperty as string;
        message = `unknown property '${propName}'`;
      }

      return {
        path: error.instancePath || "/",
        message,
      };
    });
    throw new ConfigValidationError(errors);
  }
  return true;
}

export function getValidationErrors(config: unknown): ValidationError[] {
  const valid = validate(config);
  if (!valid && validate.errors) {
    return validate.errors.map((error: ErrorObject) => ({
      path: error.instancePath || "/",
      message: error.message || "Unknown validation error",
    }));
  }
  return [];
}
