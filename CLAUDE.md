# Claude Code Guidelines

## Git Workflow

- Always create a feature branch for changes (never commit directly to `main`)
- Create a PR for review before merging

### Branch Naming Convention

Branch names **must** follow this pattern:

```
(feature|fix|hotfix|docs)/vX.Y.Z/description
```

or

```
(feature|fix|hotfix|docs)/vX.Y.Z-description
```

**Allowed prefixes:**

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `hotfix/` - Critical fixes that need immediate release
- `docs/` - Documentation changes

**Version format:** `vX.Y.Z` where X, Y, Z are numbers (e.g., `v1.2.0`, `v2.0.1`)

**Examples:**

✅ Valid:

- `feature/v1.2.0/add-dark-mode`
- `fix/v1.1.2/validation-bug`
- `hotfix/v1.1.1-critical-fix`
- `docs/v1.2.0/update-readme`
- `feature/v2.0.0-new-api`

❌ Invalid:

- `chore/v1.2.0/add-changeset` - `chore` is not an allowed prefix
- `feature/add-dark-mode` - missing version
- `v1.5/feature/something` - wrong order
- `fix/v1.5/bug` - version must be X.Y.Z (three parts)

**How to determine version:**

- Get current version from `package.json`
- For new features: bump minor (e.g., `1.1.0` → `v1.2.0`)
- For bug fixes: bump patch (e.g., `1.1.0` → `v1.1.1`)
- For breaking changes: bump major (e.g., `1.1.0` → `v2.0.0`)

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
