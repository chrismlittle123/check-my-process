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

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and releases.

### To trigger a release:

1. **Add a changeset** before merging your feature PR:
   - Create a file in `.changeset/` named `<descriptive-name>.md`
   - Format:

     ```md
     ---
     "check-my-process": patch | minor | major
     ---

     Description of the change
     ```

   - Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes

2. **Merge to main** - The Release workflow will create a "Release PR" that bumps the version

3. **Merge the Release PR** - This triggers:
   - npm publish with provenance
   - Git tag creation (e.g., `v1.2.0`)
   - GitHub Release creation

### Example changeset file:

```md
---
"check-my-process": minor
---

Add e2e testing infrastructure with real PR fixtures
```
