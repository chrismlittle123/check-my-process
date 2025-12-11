# Changelog

## 1.2.6

### Patch Changes

- 80ebabd: Fix e2e test expectation to match actual output format

## 1.2.5

### Patch Changes

- 2f08ab1: Drop Node.js 18 from CI test matrix (coverage requires Node 19+)

## 1.2.4

### Patch Changes

- e9a142f: Fix CI workflow - remove incorrect cmc check step and Python setup

## 1.2.3

### Patch Changes

- 0696cbc: Fix SSH deploy key secret name (CMC -> CMP)
- fa11308: Restore SSH key setup in release workflow for private repo access

## 1.2.2

### Patch Changes

- d823c8d: Minor code comment improvements

## 1.2.1

### Patch Changes

- 8dd0e91: Improve error handling and message clarity
  - Fix "Config is valid" message appearing before validation errors
  - Handle permission denied errors gracefully in init command
  - Sanitize config parse errors to avoid leaking file contents
  - Detect and report when config path is a directory
  - Include field names in unknown property validation errors

## 1.2.0

### Minor Changes

- adde7a7: Add e2e testing infrastructure with real PR fixtures
  - Add e2e test suite that validates check command against 7 test PRs in check-my-process-testing repo
  - Document test PR setup instructions and created fixtures
  - Update roadmap to reflect project progress and v1.2.0 milestone

## 1.1.2

### Patch Changes

- 87bea00: Improve CLI validation and implement init command
  - Implement `init` command to create starter `cmp.toml` config file with `--force` option
  - Validate `--format` option (must be "text" or "json")
  - Validate `--pr` must be a positive integer (rejects 0, -1, etc.)
  - Validate `--repo` format strictly (exactly owner/repo, rejects paths like a/b/c)
  - Show clear message when `validate` runs without config file present
  - Fix exit code to 0 when running `cmp` with no command (shows help)

## 1.1.1

### Patch Changes

- 7b8f53a: fix: improve CI workflows and add knip:check script
  - Add `knip:check` script to package.json for non-blocking unused code checks
  - Fix release workflow to skip tag/release creation if they already exist
  - Update PR branch naming pattern to allow both slash and dash separators (e.g., `feature/v1.1.0/desc` or `feature/v1.1.0-desc`)

## 0.2.1

### Patch Changes

- 0fd47e3: Add .npmignore to reduce published package size

## 0.2.0

### Minor Changes

- fd23869: Initial release with CLI skeleton and config loader
  - Add `cmp check` command (GitHub API integration coming in M2)
  - Add `cmp validate` command to validate config files
  - Add `cmp init` command placeholder
  - Add TOML config loader with schema validation
  - Support PR rules, branch naming, and ticket reference patterns

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-12-10

### Added

- Initial CLI with Commander.js
- `cmp check` command (placeholder - GitHub API integration coming in M2)
- `cmp validate` command to validate config files
- `cmp init` command (placeholder - coming in M5)
- TOML config loader with `@iarna/toml`
- Config schema with support for:
  - PR rules (max_files, max_lines, min_approvals)
  - Branch naming pattern
  - Ticket reference pattern
  - Severity levels (error, warning)
- Example `cmp.toml` configuration file
- TypeScript project setup with ESLint, Prettier, Vitest
- CI/CD workflows for GitHub Actions
- Husky hooks for pre-commit and pre-push checks
