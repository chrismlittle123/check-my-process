# Roadmap

## v0.1 — MVP

**Goal:** Validate PR process compliance using GitHub API only.

**Target:** Internal team use on `check-my-process-playground` repo.

---

### Checks

| Check | Description | Data Source |
|-------|-------------|-------------|
| PR size (files) | Max files changed in PR | GitHub API |
| PR size (lines) | Max lines changed (additions + deletions) | GitHub API |
| Branch naming | Branch name matches regex pattern | GitHub API |
| Ticket reference | Linear ticket pattern exists in title, body, or branch | GitHub API |
| Approvals | Minimum number of approvals received | GitHub API |

---

### Config

Single file: `cmp.toml` in repository root.

```toml
[settings]
default_severity = "error"

[pr]
max_files = 20
max_lines = 400
min_approvals = 1

[branch]
pattern = "^(feature|fix|hotfix)/LIN-[0-9]+-[a-z0-9-]+$"

[ticket]
pattern = "LIN-[0-9]+"
check_in = ["title", "branch", "body"]
```

**Severity:** Each rule inherits `default_severity` unless explicitly overridden with `severity = "warning"`.

---

### CLI

```bash
# Check a PR (token via env var)
GITHUB_TOKEN=xxx cmp check --repo owner/repo --pr 123

# Output formats
cmp check --repo owner/repo --pr 123 --format text
cmp check --repo owner/repo --pr 123 --format json
```

**Exit codes:**
- `0` — All checks passed (warnings allowed)
- `1` — One or more errors

---

### Output

**Text (default):**
```
check-my-process v0.1.0

PR #123: Add user authentication

  [PASS] pr.max_files: 8 files (max: 20)
  [PASS] pr.max_lines: 142 lines (max: 400)
  [FAIL] branch.pattern: "fix-auth-bug" does not match pattern
         Expected: ^(feature|fix|hotfix)/LIN-[0-9]+-[a-z0-9-]+$
  [FAIL] ticket.pattern: No ticket reference found
         Pattern: LIN-[0-9]+
         Checked: title, branch, body
  [PASS] pr.min_approvals: 2 approvals (min: 1)

Result: 3 passed, 2 failed
```

**JSON:**
```json
{
  "version": "0.1.0",
  "pr": {
    "number": 123,
    "title": "Add user authentication"
  },
  "passed": 3,
  "failed": 2,
  "results": [
    {
      "rule": "pr.max_files",
      "status": "pass",
      "message": "8 files (max: 20)"
    },
    {
      "rule": "branch.pattern",
      "status": "fail",
      "severity": "error",
      "expected": "^(feature|fix|hotfix)/LIN-[0-9]+-[a-z0-9-]+$",
      "actual": "fix-auth-bug"
    }
  ]
}
```

---

### Tech Stack

| Component | Choice |
|-----------|--------|
| Language | TypeScript |
| CLI | Commander.js |
| Config | @iarna/toml |
| GitHub API | @octokit/rest |
| Output | chalk (text), JSON.stringify (JSON) |

---

### Project Structure

```
check-my-process/
├── src/
│   ├── index.ts            # Entry point
│   ├── cli.ts              # CLI setup with Commander
│   ├── config/
│   │   ├── index.ts        # Config exports
│   │   ├── loader.ts       # TOML loading
│   │   └── schema.ts       # Config types
│   ├── github/
│   │   └── client.ts       # GitHub API wrapper
│   ├── checks/
│   │   ├── index.ts        # Check exports
│   │   ├── engine.ts       # Run all checks, aggregate results
│   │   ├── pr-size.ts      # PR size checks
│   │   ├── branch.ts       # Branch naming check
│   │   ├── ticket.ts       # Ticket reference check
│   │   └── approvals.ts    # Approval count check
│   └── output/
│       ├── index.ts        # Output exports
│       ├── text.ts         # Human-readable formatter
│       └── json.ts         # JSON formatter
├── cmp.toml                # Example config
├── package.json
└── tsconfig.json
```

---

### Milestones

**M1: Project Setup**
- [x] Initialize TypeScript project
- [ ] Set up Commander.js CLI skeleton
- [ ] Implement TOML config loader

**M2: GitHub Integration**
- [ ] Implement GitHub client with Octokit
- [ ] Fetch PR data (files, lines, branch, title, body)
- [ ] Fetch review/approval data

**M3: Checks**
- [ ] Implement PR size check (files)
- [ ] Implement PR size check (lines)
- [ ] Implement branch naming check
- [ ] Implement ticket reference check
- [ ] Implement approvals check

**M4: Output**
- [ ] Implement text formatter
- [ ] Implement JSON formatter
- [ ] Exit code logic (0 on pass, 1 on any error)

**M5: Polish**
- [ ] Error handling for missing config
- [ ] Error handling for GitHub API failures
- [ ] README with usage instructions
- [ ] Test on check-my-process-playground

---
