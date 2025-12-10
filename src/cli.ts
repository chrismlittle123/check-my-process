import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { loadConfig, ConfigNotFoundError, ConfigParseError } from "./config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "..", "package.json"), "utf-8")
    );
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
    .version(getVersion());

  program
    .command("check")
    .description("Check a PR against process standards")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., owner/repo)")
    .requiredOption("--pr <number>", "Pull request number")
    .option("--format <format>", "Output format (text, json)", "text")
    .option("--config <path>", "Path to config file")
    .action(async (options) => {
      try {
        const config = loadConfig(options.config);

        console.log(`check-my-process v${getVersion()}\n`);
        console.log(`Checking PR #${options.pr} in ${options.repo}...`);
        console.log(`Format: ${options.format}`);
        console.log(`\nConfig loaded:`);
        console.log(`  - Max files: ${config.pr?.max_files}`);
        console.log(`  - Max lines: ${config.pr?.max_lines}`);
        console.log(`  - Min approvals: ${config.pr?.min_approvals}`);
        console.log(`  - Branch pattern: ${config.branch?.pattern}`);
        console.log(`  - Ticket pattern: ${config.ticket?.pattern}`);
        console.log(`\n(GitHub API integration coming in M2)`);
      } catch (error) {
        if (error instanceof ConfigNotFoundError || error instanceof ConfigParseError) {
          console.error(`Error: ${error.message}`);
          process.exit(1);
        }
        throw error;
      }
    });

  program
    .command("init")
    .description("Create a starter cmp.toml config file")
    .action(() => {
      console.log("(init command coming in M5)");
    });

  program
    .command("validate")
    .description("Validate the cmp.toml config file")
    .option("--config <path>", "Path to config file")
    .action((options) => {
      try {
        const config = loadConfig(options.config);
        console.log("✓ Config is valid");
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
        if (error instanceof ConfigNotFoundError || error instanceof ConfigParseError) {
          console.error(`✗ ${error.message}`);
          process.exit(1);
        }
        throw error;
      }
    });

  return program;
}
