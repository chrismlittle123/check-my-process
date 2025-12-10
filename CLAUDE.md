# Claude Code Guidelines

## Git Workflow

- Always create a feature branch for changes (never commit directly to `main`)
- Create a PR for review before merging
- Branch naming must include version: `(feature|fix|hotfix|docs)/vX.Y.Z/description` or `(feature|fix|hotfix|docs)/vX.Y.Z-description`
  - Examples:
    - `feature/v1.2.0/add-dark-mode`
    - `fix/v1.1.2/validation-bug`
    - `hotfix/v1.1.1-critical-fix`
    - `docs/v1.2.0/update-readme`
  - Get current version from `package.json`
