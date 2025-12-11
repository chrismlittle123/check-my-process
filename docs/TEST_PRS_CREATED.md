# Test PRs Created for E2E Testing

Repository: `chrismlittle123/check-my-process-testing`

## Summary

All 8 test PRs have been created as permanent test fixtures for e2e testing. These PRs should remain **open** and never be merged or closed.

---

## PR #1: All Checks Pass

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/1

**Purpose:** Baseline PR that passes all validation checks.

| Check     | Status  | Details                                                           |
| --------- | ------- | ----------------------------------------------------------------- |
| Branch    | PASS    | `feature/v1.0.0/add-user-authentication`                          |
| Ticket    | PASS    | `LIN-123` in title                                                |
| Files     | PASS    | 2 files (max: 20)                                                 |
| Lines     | FAIL    | ~437 lines (max: 400) - exceeds limit due to E2E_TEST_PR_SETUP.md |
| Approvals | NEEDS 1 | Requires manual approval                                          |

**Expected Result:** Exit code `1` (fails lines check and needs approval)

---

## PR #2: Fails Branch Naming

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/2

**Purpose:** PR with invalid branch name that doesn't match the required pattern.

| Check     | Status  | Details                                      |
| --------- | ------- | -------------------------------------------- |
| Branch    | FAIL    | `fix-login-bug` (should be `fix/vX.X.X/...`) |
| Ticket    | PASS    | `LIN-456` in title                           |
| Files     | PASS    | 1 file (max: 20)                             |
| Lines     | PASS    | 1 line (max: 400)                            |
| Approvals | NEEDS 1 | Requires manual approval                     |

**Expected Result:** Exit code `1`

---

## PR #3: Fails Ticket Reference

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/3

**Purpose:** PR missing ticket reference in title, branch, and body.

| Check     | Status  | Details                      |
| --------- | ------- | ---------------------------- |
| Branch    | PASS    | `feature/v1.0.0/add-logging` |
| Ticket    | FAIL    | No `LIN-XXX` reference found |
| Files     | PASS    | 1 file (max: 20)             |
| Lines     | PASS    | 1 line (max: 400)            |
| Approvals | NEEDS 1 | Requires manual approval     |

**Expected Result:** Exit code `1`

---

## PR #4: Fails Max Files Check

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/4

**Purpose:** PR with too many files changed (exceeds 20 file limit).

| Check     | Status  | Details                          |
| --------- | ------- | -------------------------------- |
| Branch    | PASS    | `feature/v1.0.0/bulk-components` |
| Ticket    | PASS    | `LIN-789` in title               |
| Files     | FAIL    | 25 files (max: 20)               |
| Lines     | PASS    | 25 lines (max: 400)              |
| Approvals | NEEDS 1 | Requires manual approval         |

**Expected Result:** Exit code `1`

---

## PR #5: Fails Max Lines Check

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/5

**Purpose:** PR with too many lines changed (exceeds 400 line limit).

| Check     | Status  | Details                        |
| --------- | ------- | ------------------------------ |
| Branch    | PASS    | `feature/v1.0.0/large-dataset` |
| Ticket    | PASS    | `LIN-101` in title             |
| Files     | PASS    | 1 file (max: 20)               |
| Lines     | FAIL    | 453 lines (max: 400)           |
| Approvals | NEEDS 1 | Requires manual approval       |

**Expected Result:** Exit code `1`

---

## PR #6: Fails Approvals Check

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/6

**Purpose:** PR with no approvals (requires minimum 1).

| Check     | Status | Details                    |
| --------- | ------ | -------------------------- |
| Branch    | PASS   | `feature/v1.0.0/quick-fix` |
| Ticket    | PASS   | `LIN-202` in title         |
| Files     | PASS   | 1 file (max: 20)           |
| Lines     | PASS   | 1 line (max: 400)          |
| Approvals | FAIL   | 0 approvals (min: 1)       |

**Expected Result:** Exit code `1`

---

## PR #7: Multiple Failures

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/7

**Purpose:** PR that fails multiple checks at once.

| Check     | Status | Details                      |
| --------- | ------ | ---------------------------- |
| Branch    | FAIL   | `bad-branch-no-ticket`       |
| Ticket    | FAIL   | No `LIN-XXX` reference found |
| Files     | FAIL   | 25 files (max: 20)           |
| Lines     | PASS   | 25 lines (max: 400)          |
| Approvals | FAIL   | 0 approvals (min: 1)         |

**Expected Result:** Exit code `1`

---

## PR #8: All Non-Approval Checks Pass

**URL:** https://github.com/chrismlittle123/check-my-process-testing/pull/8

**Purpose:** PR that passes all checks except approvals (cannot self-approve).

| Check     | Status | Details                             |
| --------- | ------ | ----------------------------------- |
| Branch    | PASS   | `feature/v1.0.0/LIN-300-passing-pr` |
| Ticket    | PASS   | `LIN-300` in title and branch       |
| Files     | PASS   | 1 file (max: 20)                    |
| Lines     | PASS   | 8 lines (max: 400)                  |
| Approvals | FAIL   | 0 approvals (min: 1) - needs manual |

**Expected Result:** Exit code `1` (only fails approvals)

**Note:** This PR passes all validation checks except approvals. Once manually approved, it would pass all checks with exit code `0`.

---

## Summary Table

| PR # | URL                                                                         | Branch | Ticket | Files | Lines | Approvals | Expected |
| ---- | --------------------------------------------------------------------------- | ------ | ------ | ----- | ----- | --------- | -------- |
| 1    | [PR #1](https://github.com/chrismlittle123/check-my-process-testing/pull/1) | PASS   | PASS   | PASS  | FAIL  | NEEDS 1   | FAIL     |
| 2    | [PR #2](https://github.com/chrismlittle123/check-my-process-testing/pull/2) | FAIL   | PASS   | PASS  | PASS  | NEEDS 1   | FAIL     |
| 3    | [PR #3](https://github.com/chrismlittle123/check-my-process-testing/pull/3) | PASS   | FAIL   | PASS  | PASS  | NEEDS 1   | FAIL     |
| 4    | [PR #4](https://github.com/chrismlittle123/check-my-process-testing/pull/4) | PASS   | PASS   | FAIL  | PASS  | NEEDS 1   | FAIL     |
| 5    | [PR #5](https://github.com/chrismlittle123/check-my-process-testing/pull/5) | PASS   | PASS   | PASS  | FAIL  | NEEDS 1   | FAIL     |
| 6    | [PR #6](https://github.com/chrismlittle123/check-my-process-testing/pull/6) | PASS   | PASS   | PASS  | PASS  | FAIL      | FAIL     |
| 7    | [PR #7](https://github.com/chrismlittle123/check-my-process-testing/pull/7) | FAIL   | FAIL   | FAIL  | PASS  | FAIL      | FAIL     |
| 8    | [PR #8](https://github.com/chrismlittle123/check-my-process-testing/pull/8) | PASS   | PASS   | PASS  | PASS  | FAIL      | FAIL     |

Note: PR #1 exceeds 400 lines due to E2E_TEST_PR_SETUP.md being included.
Note: PR #8 passes all checks except approvals (requires manual approval to fully pass).

---

## Manual Actions Required

1. **PR #1** needs 1 approval to fully pass all checks
2. **PRs #2-5** need 1 approval each (but will still fail their respective checks)
3. **PRs #6-7** should NOT receive any approvals (to test approval check failures)
4. **PR #8** needs 1 approval to become a fully passing PR (all other checks already pass)

---

## Configuration

The repository is configured with `cmp.toml`:

```toml
[settings]
default_severity = "error"

[pr]
max_files = 20
max_lines = 400
min_approvals = 1

[branch]
pattern = "^(feature|fix|hotfix|docs)/v[0-9]+\\.[0-9]+\\.[0-9]+/.+$"

[ticket]
pattern = "LIN-[0-9]+"
check_in = ["title", "branch", "body"]
```
