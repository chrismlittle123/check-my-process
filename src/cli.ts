import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  loadConfig,
  findConfigPath,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
} from "./config/index.js";
import { createGitHubClient } from "./github/index.js";
import { runChecks } from "./checks/index.js";
import { formatResults } from "./formatter.js";
import type { OutputFormat } from "./formatter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
    return packageJson.version;
  } catch {
    return "0.0.0";
  }
}

export function createCli(): Command {
  const program = new Command();

  program
    .name("cmp")
    .description("Enforce software development process standards as code")
    .version(getVersion())
    .action(() => {
      program.help();
    });

  program
    .command("check")
    .description("Check a PR against process standards")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., owner/repo)")
    .requiredOption("--pr <number>", "Pull request number")
    .option("--format <format>", "Output format (text, json)", "text")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        // Validate --format option
        const validFormats = ["text", "json"];
        if (!validFormats.includes(options.format)) {
          console.error(`Error: --format must be one of: ${validFormats.join(", ")}`);
          process.exit(1);
        }

        // Validate --repo format (must be exactly owner/repo)
        const repoMatch = options.repo.match(/^([^/]+)\/([^/]+)$/);
        if (!repoMatch) {
          console.error("Error: --repo must be in format owner/repo (e.g., facebook/react)");
          process.exit(1);
        }
        const [, owner, repo] = repoMatch;

        // Validate --pr is a positive integer
        const prNumber = parseInt(options.pr, 10);
        if (isNaN(prNumber) || prNumber < 1) {
          console.error("Error: --pr must be a positive integer");
          process.exit(1);
        }

        const config = loadConfig(options.config);
        const token = process.env.GITHUB_TOKEN;

        if (!token) {
          console.error("Error: GITHUB_TOKEN environment variable is required");
          console.error("Set it with: export GITHUB_TOKEN=<your-token>");
          process.exit(1);
        }

        const client = createGitHubClient({
          token,
          baseUrl: process.env.GITHUB_API_URL,
        });

        const pr = await client.getPullRequest(owner, repo, prNumber);
        const summary = runChecks({ pr, config });

        const output = formatResults(summary, {
          format: options.format as OutputFormat,
          version: getVersion(),
          repo: options.repo,
          prNumber,
        });

        console.log(output);

        if (summary.hasErrors) {
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof ConfigValidationError) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
        if (error instanceof ConfigNotFoundError || error instanceof ConfigParseError) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
        if (error instanceof Error) {
          // Handle GitHub API errors
          if (error.message.includes("Bad credentials")) {
            console.error("Error: Invalid GitHub token");
            process.exit(1);
          }
          if (error.message.includes("Not Found")) {
            console.error(`Error: PR #${options.pr} not found in ${options.repo}`);
            process.exit(1);
          }
          if (error.message.includes("rate limit")) {
            console.error("Error: GitHub API rate limit exceeded");
            process.exit(1);
          }
        }
        throw error;
      }
    });

  program
    .command("init")
    .description("Create a starter cmp.toml config file")
    .option("--force", "Overwrite existing config file")
    .action((options) => {
      const configPath = join(process.cwd(), "cmp.toml");

      if (existsSync(configPath) && !options.force) {
        console.error("Error: cmp.toml already exists. Use --force to overwrite.");
        process.exit(1);
      }

      const template = `# check-my-process configuration
# See https://github.com/check-my-process for documentation

[settings]
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
`;

      writeFileSync(configPath, template);
      console.log("Created cmp.toml");
    });

  program
    .command("validate")
    .description("Validate the cmp.toml config file")
    .option("--config <path>", "Path to config file")
    .action((options) => {
      try {
        // Check if a config file exists before loading
        const explicitPath = options.config;
        const foundPath = explicitPath ?? findConfigPath();

        if (!foundPath) {
          console.log("No cmp.toml found. Showing default configuration:");
          console.log("\nRun 'cmp init' to create a config file.\n");
        } else {
          console.log("Config is valid");
        }

        const config = loadConfig(options.config);

        console.log(`\nSettings:`);
        console.log(`  default_severity: ${config.settings.default_severity}`);
        if (config.pr) {
          console.log(`\nPR rules:`);
          if (config.pr.max_files) console.log(`  max_files: ${config.pr.max_files}`);
          if (config.pr.max_lines) console.log(`  max_lines: ${config.pr.max_lines}`);
          if (config.pr.min_approvals) console.log(`  min_approvals: ${config.pr.min_approvals}`);
        }
        if (config.branch?.pattern) {
          console.log(`\nBranch rules:`);
          console.log(`  pattern: ${config.branch.pattern}`);
        }
        if (config.ticket?.pattern) {
          console.log(`\nTicket rules:`);
          console.log(`  pattern: ${config.ticket.pattern}`);
          console.log(`  check_in: ${config.ticket.check_in?.join(", ")}`);
        }
      } catch (error) {
        if (error instanceof ConfigValidationError) {
          console.error(`${error.message}`);
          process.exit(1);
        }
        if (error instanceof ConfigNotFoundError || error instanceof ConfigParseError) {
          console.error(`${error.message}`);
          process.exit(1);
        }
        throw error;
      }
    });

  return program;
}
