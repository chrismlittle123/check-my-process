# Product Requirements Document: check-my-process

> Enforce software development process standards as code.

---

## Overview

### Problem Statement

Software teams struggle to maintain consistent development processes across repositories and team members. Process standards — how PRs should be sized, how commits should be formatted, how reviews should work — typically live in wikis that nobody reads, or exist as tribal knowledge that doesn't scale.

When standards aren't enforced:
- PRs become too large to review effectively
- Commits lack traceability to tickets
- Branch protection is inconsistently configured
- New team members don't learn "how we do things here"
- Tech leads spend time policing instead of building

### Solution

`check-my-process` is a CLI tool that lets teams define their development process standards in a machine-readable format (TOML) and automatically enforce compliance at PR time.

Standards are portable — teams can share them via URL, enabling instant adoption of another team's process.

### Vision

> "Here, use our standards file" becomes a complete transfer of engineering process.

---

## Goals

| Goal | Success Metric |
|------|----------------|
| Codify process standards | Teams can express all process rules in TOML |
| Enforce at PR time | Non-compliant PRs are blocked in CI |
| Enable portability | Standards can be imported via URL with one command |
| Reduce manual policing | Tech leads spend less time on process review |
| Accelerate onboarding | New devs understand process by reading standards file |

### Non-Goals (v1)

- Documentation generation from standards
- Config file generation (that's a separate tool)
- Operations/observability checks
- Non-GitHub Git providers (GitLab, Bitbucket)
- Non-PR workflows (direct commits to main)

---

## User Personas

### Primary: Tech Lead / Engineering Manager

- Responsible for team process and quality
- Currently enforces standards manually in PR reviews
- Wants to automate the "did you follow the process?" checks
- Wants to share standards across multiple repositories

### Secondary: Platform Engineer

- Maintains org-wide standards and tooling
- Wants to define baseline standards that all teams inherit
- Needs visibility into compliance across teams

### Tertiary: Individual Developer

- Wants to know what's expected before opening a PR
- Frustrated by inconsistent feedback on process
- Wants fast, clear feedback on what to fix

---

## Core Concepts

### Standards File

A TOML file that declares what the team's process standards are. This is the source of truth.

```
.standards/
├── config.toml          # Metadata, inheritance, overrides
└── process/
    ├── git.toml         # Commit and branch rules
    ├── pr.toml          # Pull request rules
    ├── reviews.toml     # Code review rules
    └── cicd.toml        # CI/CD pipeline rules
```

### Enforcement

The CLI checks the current repository (and optionally GitHub API) against the declared standards and reports pass/fail for each rule.

### Inheritance

Teams can inherit standards from a base (e.g., org-wide standards) and override specific rules.

---

## Functional Requirements

### FR1: Standard Definitions

The tool must support defining standards for the following areas:

#### FR1.1: Git Hygiene

| Rule | Description | Check Method |
|------|-------------|--------------|
| `commits.format` | Commit message format (conventional, custom regex) | Parse git log |
| `commits.max_subject_length` | Maximum subject line length | Parse git log |
| `commits.require_ticket_reference` | Commit must reference ticket | Regex match |
| `commits.require_signed` | Commits must be GPG signed | Git log |
| `branches.naming_pattern` | Branch name must match pattern | Git/GitHub API |
| `branches.protected` | List of branches that must be protected | GitHub API |
| `branches.max_age_days` | Maximum age of unmerged branches | GitHub API |

#### FR1.2: Pull Requests

| Rule | Description | Check Method |
|------|-------------|--------------|
| `pr.template_required` | PR must use template | Parse PR body |
| `pr.min_description_length` | Minimum PR description length | Parse PR body |
| `pr.required_sections` | Required sections in PR body | Parse PR body |
| `pr.size.max_files` | Maximum files changed | GitHub API |
| `pr.size.max_lines` | Maximum lines changed | GitHub API |
| `pr.labels.required` | PR must have at least one label | GitHub API |
| `pr.labels.allowed` | Whitelist of allowed labels | GitHub API |
| `pr.tickets.required` | Must reference a ticket | Regex match |
| `pr.tickets.pattern` | Ticket pattern (e.g., `[A-Z]+-[0-9]+`) | Regex match |
| `pr.tickets.check_in` | Where to look: title, body, branch | Configurable |
| `pr.tickets.validate_exists` | Verify ticket exists in Jira/Linear | External API |

#### FR1.3: Code Review

| Rule | Description | Check Method |
|------|-------------|--------------|
| `reviews.min_approvals` | Minimum approvals required | GitHub API |
| `reviews.require_codeowners` | CODEOWNERS file must exist | File check |
| `reviews.codeowners_enforced` | CODEOWNERS approval required | GitHub API |
| `reviews.dismiss_stale` | Stale reviews dismissed on new commits | GitHub API |
| `reviews.no_self_approval` | Author cannot approve own PR | GitHub API |
| `reviews.require_resolved_threads` | All threads must be resolved | GitHub API |

#### FR1.4: Branch Protection

| Rule | Description | Check Method |
|------|-------------|--------------|
| `branch_protection.require_pr` | Direct pushes blocked | GitHub API |
| `branch_protection.require_status_checks` | CI must pass | GitHub API |
| `branch_protection.required_checks` | Specific checks required | GitHub API |
| `branch_protection.require_up_to_date` | Branch must be current | GitHub API |
| `branch_protection.require_linear_history` | No merge commits | GitHub API |
| `branch_protection.restrict_pushes` | Limit who can push | GitHub API |

#### FR1.5: CI/CD

| Rule | Description | Check Method |
|------|-------------|--------------|
| `cicd.required_jobs` | Jobs that must exist in workflow | Parse workflow YAML |
| `cicd.require_timeout` | Jobs must have timeouts | Parse workflow YAML |
| `cicd.max_timeout_minutes` | Maximum timeout allowed | Parse workflow YAML |
| `cicd.no_skip_ci` | `[skip ci]` not allowed on protected branches | Commit message |
| `cicd.require_environment_protection` | Prod deploys need approval | GitHub API |

#### FR1.6: Release (Future)

| Rule | Description | Check Method |
|------|-------------|--------------|
| `release.require_version_bump` | Version must be incremented | File parse |
| `release.require_changelog` | CHANGELOG must be updated | File parse |
| `release.tag_format` | Tag must match pattern | Git tags |

---

### FR2: Inheritance & Overrides

#### FR2.1: Import Remote Standards

```toml
[inherits]
from = "github.com/acme/platform-standards"
ref = "v2.3.0"
```

The tool must:
- Fetch standards from a Git URL
- Pin to a specific ref (tag, branch, commit)
- Cache fetched standards locally

#### FR2.2: Override Rules

```toml
[overrides]
process.pr.size.max_files = 30
process.reviews.min_approvals = 1
```

The tool must:
- Apply overrides on top of inherited standards
- Validate overrides are within allowed bounds (if defined)

#### FR2.3: Disable Rules

```toml
[disable]
rules = [
  "process.commits.require_signed",
  "process.pr.tickets.validate_exists",
]
```

The tool must:
- Skip disabled rules during checks
- Report disabled rules in output (for visibility)

---

### FR3: CLI Interface

#### FR3.1: Check Command

```bash
# Check all process standards
$ check-my-process

# Check specific area
$ check-my-process --only git
$ check-my-process --only pr
$ check-my-process --only reviews

# Check against remote standards (without local config)
$ check-my-process --from github.com/acme/platform-standards

# Output formats
$ check-my-process --format text      # Human-readable (default)
$ check-my-process --format json      # Machine-readable
$ check-my-process --format sarif     # GitHub code scanning
```

#### FR3.2: Init Command

```bash
# Create starter standards files
$ check-my-process init

# Init from remote template
$ check-my-process init --from github.com/acme/platform-standards
```

#### FR3.3: Diff Command

```bash
# Compare local standards against remote
$ check-my-process diff github.com/acme/platform-standards
```

#### FR3.4: Validate Command

```bash
# Validate standards files are syntactically correct
$ check-my-process validate
```

---

### FR4: CI Integration

#### FR4.1: GitHub Action

```yaml
- uses: check-my-process/action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

The action must:
- Run checks on PR events
- Post results as PR check / status
- Optionally post inline comments
- Exit non-zero on failures (block merge)

#### FR4.2: PR Context

When running in CI, the tool must:
- Detect it's running in a PR context
- Use PR metadata (number, author, labels) for checks
- Only check commits in the PR (not full history)

---

### FR5: Reporting

#### FR5.1: Output Format

```
$ check-my-process

check-my-process v1.0.0

Git
  ✓ commits.format: All 3 commits follow conventional format
  ✓ commits.max_subject_length: All subjects under 72 chars
  ✗ branches.naming_pattern: "fix-bug" doesn't match pattern
    Expected: ^(feature|fix|hotfix|chore)/[A-Z]+-[0-9]+-[a-z0-9-]+$

Pull Request
  ✓ pr.size.max_files: 8 files (max: 20)
  ✓ pr.size.max_lines: 142 lines (max: 400)
  ✗ pr.tickets.required: No ticket found in title, body, or branch
    Pattern: [A-Z]+-[0-9]+

Reviews
  ✓ reviews.min_approvals: 2 approvals (min: 2)
  ✓ reviews.require_codeowners: CODEOWNERS file exists

Branch Protection
  ✓ branch_protection.require_pr: Enabled on main
  ✗ branch_protection.require_up_to_date: Not enabled on main

──────────────────────────────────────────────
Result: 7 passed, 3 failed
```

#### FR5.2: JSON Output

```json
{
  "version": "1.0.0",
  "passed": 7,
  "failed": 3,
  "results": [
    {
      "rule": "git.commits.format",
      "status": "passed",
      "message": "All 3 commits follow conventional format"
    },
    {
      "rule": "git.branches.naming_pattern",
      "status": "failed",
      "expected": "^(feature|fix|hotfix|chore)/[A-Z]+-[0-9]+-[a-z0-9-]+$",
      "actual": "fix-bug"
    }
  ]
}
```

---

## Non-Functional Requirements

### NFR1: Performance

- Full check completes in < 10 seconds for typical repos
- GitHub API calls are parallelized where possible
- Results are cached within a single run

### NFR2: Security

- GitHub token is never logged or exposed
- Standards files are validated before execution
- No arbitrary code execution from standards files

### NFR3: Reliability

- Graceful handling of GitHub API rate limits
- Clear error messages when checks can't run
- Offline mode for file-based checks only

### NFR4: Compatibility

- Runs on Linux, macOS, Windows
- Single binary distribution (no runtime dependencies)
- Supports GitHub.com and GitHub Enterprise

---

## Technical Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI                                 │
│  - Argument parsing                                         │
│  - Output formatting                                        │
│  - Exit codes                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Standards Loader                         │
│  - Parse TOML files                                         │
│  - Resolve inheritance                                      │
│  - Apply overrides                                          │
│  - Validate schema                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Check Engine                             │
│  - Orchestrate checks                                       │
│  - Aggregate results                                        │
│  - Handle errors                                            │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌───────────┐   ┌───────────┐   ┌───────────┐
     │ Git       │   │ GitHub    │   │ File      │
     │ Checker   │   │ Checker   │   │ Checker   │
     │           │   │           │   │           │
     │ - Log     │   │ - API     │   │ - YAML    │
     │ - Refs    │   │ - GraphQL │   │ - TOML    │
     │ - Config  │   │           │   │ - MD      │
     └───────────┘   └───────────┘   └───────────┘
```

### Technology Choices

| Component | Recommendation | Rationale |
|-----------|----------------|-----------|
| Language | Go | Single binary, fast, good CLI libs |
| TOML parsing | BurntSushi/toml | Standard Go TOML lib |
| CLI framework | Cobra | Industry standard |
| GitHub API | go-github | Official client |
| Output | lipgloss/charm | Beautiful terminal output |
| Testing | testify | Assertions and mocks |

---

## Rollout Plan

### Phase 1: Core (v0.1)

**Scope:**
- Git checks (commits, branches)
- PR checks (size, tickets, description)
- Review checks (approvals, CODEOWNERS)
- Local file checks only (no GitHub API)
- Text output only

**Timeline:** 4 weeks

### Phase 2: GitHub Integration (v0.2)

**Scope:**
- GitHub API integration
- Branch protection checks
- GitHub Action
- JSON/SARIF output

**Timeline:** 3 weeks

### Phase 3: Inheritance (v0.3)

**Scope:**
- Remote standards fetching
- Inheritance resolution
- Overrides and disables
- Diff command

**Timeline:** 3 weeks

### Phase 4: Polish (v1.0)

**Scope:**
- CI/CD workflow checks
- External ticket validation (Jira/Linear)
- Documentation
- Public release

**Timeline:** 2 weeks

---

## Example Standards Files

### .standards/config.toml

```toml
[meta]
name = "Acme Backend Standards"
version = "1.0.0"

[inherits]
from = "github.com/acme/org-standards"
ref = "v2.0.0"

[overrides]
process.pr.size.max_lines = 500

[disable]
rules = ["process.commits.require_signed"]
```

### .standards/process/git.toml

```toml
[commits]
format = "conventional"
max_subject_length = 72
require_ticket_reference = true
ticket_pattern = "[A-Z]+-[0-9]+"
require_signed = false

[branches]
naming_pattern = "^(feature|fix|hotfix|chore)/[A-Z]+-[0-9]+-[a-z0-9-]+$"
protected = ["main", "develop"]
max_age_days = 30
```

### .standards/process/pr.toml

```toml
template_required = true
min_description_length = 50
required_sections = ["Summary", "Testing"]

[size]
max_files = 20
max_lines = 400

[labels]
required = true
allowed = ["bug", "feature", "chore", "breaking", "dependencies"]

[tickets]
required = true
pattern = "[A-Z]+-[0-9]+"
check_in = ["title", "branch", "body"]
validate_exists = false
```

### .standards/process/reviews.toml

```toml
min_approvals = 2
require_codeowners = true
codeowners_enforced = true
dismiss_stale = true
no_self_approval = true
require_resolved_threads = true
```

### .standards/process/cicd.toml

```toml
required_jobs = ["lint", "test", "build"]
require_timeout = true
max_timeout_minutes = 30
no_skip_ci = true

[branch_protection]
require_pr = true
require_status_checks = true
required_checks = ["lint", "test"]
require_up_to_date = true
require_linear_history = false
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Adoption | 10 teams in 3 months | Teams with standards file |
| PR compliance | 90% pass rate | CI check results |
| Time saved | 2 hrs/week per tech lead | Survey |
| Standards shared | 50% teams inherit from org | Config analysis |
| Developer satisfaction | 4/5 rating | Survey |

---

## Open Questions

1. **Tiered enforcement?** Should standards support different strictness levels (prototype vs production)?

2. **Auto-fix?** Should the tool offer to fix issues (e.g., rename branch, add label)?

3. **Gradual rollout?** Should there be a "warn only" mode for new rules?

4. **External integrations?** Priority order for Jira, Linear, Azure DevOps, etc.?

5. **Monorepo support?** Different standards for different packages in a monorepo?

---

## Appendix: Competitive Landscape

| Tool | What It Does | Gap |
|------|--------------|-----|
| Danger JS | PR automation/checks | Per-repo config, not portable |
| Probot | GitHub automation | Low-level, requires custom code |
| GitHub Branch Protection | Enforce PR rules | Manual config per repo |
| OpsLevel | Service maturity scorecards | Doesn't generate/enforce configs |
| Trunk | Meta-linter | Code only, not process |

`check-my-process` fills the gap: **portable, declarative process standards with automated enforcement**.