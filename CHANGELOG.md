# Changelog

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
