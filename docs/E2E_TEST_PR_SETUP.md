# E2E Test PR Setup Instructions

This document provides detailed instructions for creating test PRs in the `check-my-process-testing` repository. These PRs will serve as permanent test fixtures for e2e testing.

## Prerequisites

1. Create the repository `check-my-process-testing` (if not exists)
2. Initialize it with a README and a `cmp.toml` config file
3. All test PRs should remain **open** permanently (never merge or close them)

## Config for Playground Repository

Add this `cmp.toml` to the playground repository root:

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

---

## PR #1: All Checks Pass

**Purpose:** Baseline PR that passes all validation checks.

**Expected Result:** Exit code `0`, all checks pass.

### Instructions

1. **Create branch:**

   ```bash
   git checkout -b feature/v1.0.0/add-user-authentication
   ```

2. **Create a small change** (under 20 files, under 400 lines):

   ```bash
   mkdir -p src
   echo "// User authentication module" > src/auth.ts
   echo "export function login() { return true; }" >> src/auth.ts
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "LIN-123 Add user authentication"
   git push -u origin feature/v1.0.0/add-user-authentication
   ```

4. **Create PR with:**
   - **Title:** `LIN-123 Add user authentication`
   - **Body:**

     ```
     ## Summary
     Adds basic user authentication module.

     Ticket: LIN-123
     ```

5. **Get 1 approval** from another user/collaborator

### Validation Checklist

- [x] Branch matches pattern: `feature/v1.0.0/add-user-authentication`
- [x] Ticket reference in title: `LIN-123`
- [x] Files changed: 1 (max: 20)
- [x] Lines changed: ~2 (max: 400)
- [x] Approvals: 1 (min: 1)

---

## PR #2: Fails Branch Naming

**Purpose:** PR with invalid branch name that doesn't match the required pattern.

**Expected Result:** Exit code `1`, branch check fails.

### Instructions

1. **Create branch with INVALID name** (missing version prefix):

   ```bash
   git checkout main
   git checkout -b fix-login-bug
   ```

2. **Create a small change:**

   ```bash
   echo "// Fixed login bug" > src/login-fix.ts
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "LIN-456 Fix login bug"
   git push -u origin fix-login-bug
   ```

4. **Create PR with:**
   - **Title:** `LIN-456 Fix login bug`
   - **Body:**

     ```
     ## Summary
     Fixes the login bug.

     Ticket: LIN-456
     ```

5. **Get 1 approval**

### Validation Checklist

- [ ] Branch matches pattern: `fix-login-bug` ❌ (should be `fix/v1.0.0/login-bug`)
- [x] Ticket reference in title: `LIN-456`
- [x] Files changed: 1 (max: 20)
- [x] Lines changed: ~1 (max: 400)
- [x] Approvals: 1 (min: 1)

---

## PR #3: Fails Ticket Reference

**Purpose:** PR missing ticket reference in title, branch, and body.

**Expected Result:** Exit code `1`, ticket check fails.

### Instructions

1. **Create branch:**

   ```bash
   git checkout main
   git checkout -b feature/v1.0.0/add-logging
   ```

2. **Create a small change:**

   ```bash
   echo "// Logging utilities" > src/logger.ts
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "Add logging utilities"
   git push -u origin feature/v1.0.0/add-logging
   ```

4. **Create PR with NO ticket reference:**
   - **Title:** `Add logging utilities` (no LIN-XXX)
   - **Body:**

     ```
     ## Summary
     Adds logging utilities for debugging.

     No ticket associated.
     ```

5. **Get 1 approval**

### Validation Checklist

- [x] Branch matches pattern: `feature/v1.0.0/add-logging`
- [ ] Ticket reference: ❌ Not found in title, branch, or body
- [x] Files changed: 1 (max: 20)
- [x] Lines changed: ~1 (max: 400)
- [x] Approvals: 1 (min: 1)

---

## PR #4: Fails Max Files Check

**Purpose:** PR with too many files changed (exceeds 20 file limit).

**Expected Result:** Exit code `1`, max_files check fails.

### Instructions

1. **Create branch:**

   ```bash
   git checkout main
   git checkout -b feature/v1.0.0/bulk-components
   ```

2. **Create 25 files** (exceeds 20 file limit):

   ```bash
   mkdir -p src/components
   for i in {1..25}; do
     echo "// Component $i" > "src/components/Component$i.ts"
   done
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "LIN-789 Add bulk components"
   git push -u origin feature/v1.0.0/bulk-components
   ```

4. **Create PR with:**
   - **Title:** `LIN-789 Add bulk components`
   - **Body:**

     ```
     ## Summary
     Adds 25 new components.

     Ticket: LIN-789
     ```

5. **Get 1 approval**

### Validation Checklist

- [x] Branch matches pattern: `feature/v1.0.0/bulk-components`
- [x] Ticket reference in title: `LIN-789`
- [ ] Files changed: 25 ❌ (max: 20)
- [x] Lines changed: ~25 (max: 400)
- [x] Approvals: 1 (min: 1)

---

## PR #5: Fails Max Lines Check

**Purpose:** PR with too many lines changed (exceeds 400 line limit).

**Expected Result:** Exit code `1`, max_lines check fails.

### Instructions

1. **Create branch:**

   ```bash
   git checkout main
   git checkout -b feature/v1.0.0/large-dataset
   ```

2. **Create a file with 500+ lines:**

   ```bash
   mkdir -p src/data
   echo "// Large dataset" > src/data/dataset.ts
   echo "export const data = [" >> src/data/dataset.ts
   for i in {1..450}; do
     echo "  { id: $i, name: 'Item $i' }," >> src/data/dataset.ts
   done
   echo "];" >> src/data/dataset.ts
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "LIN-101 Add large dataset"
   git push -u origin feature/v1.0.0/large-dataset
   ```

4. **Create PR with:**
   - **Title:** `LIN-101 Add large dataset`
   - **Body:**

     ```
     ## Summary
     Adds a large dataset file.

     Ticket: LIN-101
     ```

5. **Get 1 approval**

### Validation Checklist

- [x] Branch matches pattern: `feature/v1.0.0/large-dataset`
- [x] Ticket reference in title: `LIN-101`
- [x] Files changed: 1 (max: 20)
- [ ] Lines changed: ~453 ❌ (max: 400)
- [x] Approvals: 1 (min: 1)

---

## PR #6: Fails Approvals Check

**Purpose:** PR with no approvals (requires minimum 1).

**Expected Result:** Exit code `1`, min_approvals check fails.

### Instructions

1. **Create branch:**

   ```bash
   git checkout main
   git checkout -b feature/v1.0.0/quick-fix
   ```

2. **Create a small change:**

   ```bash
   echo "// Quick fix" > src/quickfix.ts
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "LIN-202 Quick fix"
   git push -u origin feature/v1.0.0/quick-fix
   ```

4. **Create PR with:**
   - **Title:** `LIN-202 Quick fix`
   - **Body:**

     ```
     ## Summary
     A quick fix.

     Ticket: LIN-202
     ```

5. **DO NOT get any approvals** - leave PR without reviews

### Validation Checklist

- [x] Branch matches pattern: `feature/v1.0.0/quick-fix`
- [x] Ticket reference in title: `LIN-202`
- [x] Files changed: 1 (max: 20)
- [x] Lines changed: ~1 (max: 400)
- [ ] Approvals: 0 ❌ (min: 1)

---

## PR #7: Multiple Failures

**Purpose:** PR that fails multiple checks at once.

**Expected Result:** Exit code `1`, multiple checks fail (branch, ticket, files).

### Instructions

1. **Create branch with INVALID name:**

   ```bash
   git checkout main
   git checkout -b bad-branch-no-ticket
   ```

2. **Create 25 files:**

   ```bash
   mkdir -p src/bad
   for i in {1..25}; do
     echo "// Bad file $i" > "src/bad/Bad$i.ts"
   done
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "Add bad files"
   git push -u origin bad-branch-no-ticket
   ```

4. **Create PR with NO ticket reference:**
   - **Title:** `Add bad files`
   - **Body:**
     ```
     ## Summary
     Adding files without following process.
     ```

5. **DO NOT get any approvals**

### Validation Checklist

- [ ] Branch matches pattern: `bad-branch-no-ticket` ❌
- [ ] Ticket reference: ❌ Not found
- [ ] Files changed: 25 ❌ (max: 20)
- [x] Lines changed: ~25 (max: 400)
- [ ] Approvals: 0 ❌ (min: 1)

---

## PR Summary Table

| PR # | Branch | Ticket | Files | Lines | Approvals | Expected |
| ---- | ------ | ------ | ----- | ----- | --------- | -------- |
| 1    | ✅     | ✅     | ✅    | ✅    | ✅        | PASS     |
| 2    | ❌     | ✅     | ✅    | ✅    | ✅        | FAIL     |
| 3    | ✅     | ❌     | ✅    | ✅    | ✅        | FAIL     |
| 4    | ✅     | ✅     | ❌    | ✅    | ✅        | FAIL     |
| 5    | ✅     | ✅     | ✅    | ❌    | ✅        | FAIL     |
| 6    | ✅     | ✅     | ✅    | ✅    | ❌        | FAIL     |
| 7    | ❌     | ❌     | ❌    | ✅    | ❌        | FAIL     |
| 8    | ✅     | ✅     | ✅    | ✅    | ❌        | FAIL     |

---

## PR #8: All Non-Approval Checks Pass

**Purpose:** PR that passes all checks except approvals (cannot self-approve).

**Expected Result:** Exit code `1` (only fails approvals). Once approved, exit code `0`.

### Instructions

1. **Create branch:**

   ```bash
   git checkout main
   git checkout -b feature/v1.0.0/LIN-300-passing-pr
   ```

2. **Create a small change:**

   ```bash
   mkdir -p src/passing
   cat > src/passing/example.ts << 'EOF'
   // LIN-300: Example passing module
   export function greet(name: string): string {
     return `Hello, ${name}!`;
   }

   export function add(a: number, b: number): number {
     return a + b;
   }
   EOF
   ```

3. **Commit and push:**

   ```bash
   git add .
   git commit -m "LIN-300 Add example passing module"
   git push -u origin feature/v1.0.0/LIN-300-passing-pr
   ```

4. **Create PR with:**
   - **Title:** `LIN-300 Add example passing module`
   - **Body:**

     ```
     ## Summary
     Adds example passing module for e2e testing.

     Ticket: LIN-300

     This PR is designed to pass all validation checks.
     ```

5. **Get 1 approval** (required for PR to fully pass)

### Validation Checklist

- [x] Branch matches pattern: `feature/v1.0.0/LIN-300-passing-pr`
- [x] Ticket reference in title and branch: `LIN-300`
- [x] Files changed: 1 (max: 20)
- [x] Lines changed: 8 (max: 400)
- [ ] Approvals: 0 ❌ (min: 1) - needs manual approval

---

## E2E Test File Example

Once PRs are created, the e2e test file should look like:

```typescript
// tests/e2e/check.test.ts
import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

const PLAYGROUND_REPO = "chrismlittle123/check-my-process-testing";
const CLI = "node dist/index.js";

describe("check command with real PRs", () => {
  // Note: PR #1 currently fails due to lines exceeding 400 and missing approvals
  it("PR #1: should fail due to lines/approvals", () => {
    try {
      execSync(`${CLI} check --repo ${PLAYGROUND_REPO} --pr 1 --format json`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with code 1");
    } catch (error) {
      const result = JSON.parse((error as any).stdout);
      expect(result.failed).toBeGreaterThan(0);
    }
  });

  it("PR #2: should fail branch naming check", () => {
    try {
      execSync(`${CLI} check --repo ${PLAYGROUND_REPO} --pr 2`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      expect.fail("Should have exited with code 1");
    } catch (error) {
      expect((error as any).status).toBe(1);
    }
  });

  // ... similar tests for PRs 3-7
});
```

---

## Maintenance Notes

1. **Never merge or close these PRs** - they are permanent test fixtures
2. **If a PR is accidentally closed**, recreate it following the same instructions
3. **Update this document** if the `cmp.toml` config changes
4. **PR numbers may differ** - update the e2e test file with actual PR numbers after creation
