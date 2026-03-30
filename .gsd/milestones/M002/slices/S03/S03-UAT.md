# S03: Workflow readiness detection — UAT

**Milestone:** M002
**Written:** 2026-03-28T16:36:39.644Z

# S03 UAT — Workflow Readiness Detection

## Preconditions

- `node server.js` running on port 3001
- At least one project with a known `rootPath` registered (project ID 1 in dev)
- The command-center repo itself is used as the test project (has `.gsd/` and related docs, but Holistic and GSD tools are not in PATH on this machine)
- `npx tsc --noEmit` passing (checked in T02 verification)

---

## Test Cases

### TC-01: API returns readiness object with correct shape

**Steps:**
1. `curl -s http://localhost:3001/api/projects/1/plan`
2. Inspect the `readiness` field in the response JSON

**Expected:**
- `readiness` key exists at the top level
- `readiness.overallReadiness` is one of `'ready'`, `'partial'`, or `'missing'`
- `readiness.components` is an array of exactly 10 items
- Each component has `id`, `label`, `kind`, `status`, `required`, and `note` fields
- `readiness.gaps` is an array of strings (may be empty if all required components present)

---

### TC-02: Required components marked missing become gaps

**Steps:**
1. `curl -s http://localhost:3001/api/projects/1/plan`
2. Inspect `readiness.gaps` and cross-reference with `readiness.components` where `required === true && status === 'missing'`

**Expected:**
- `gaps` contains exactly the labels of components where `required === true` and `status === 'missing'`
- No optional components appear in `gaps` even if `status === 'missing'`

---

### TC-03: workflowState evidence includes Readiness signal

**Steps:**
1. `curl -s http://localhost:3001/api/projects/1/plan`
2. Inspect `workflowState.evidence`

**Expected:**
- Evidence array contains `{ label: 'Readiness', value: <overallReadiness value> }`
- Value matches `readiness.overallReadiness`

---

### TC-04: workflowState reasons includes gap description when not ready

**Precondition:** At least one required component is missing (gaps.length > 0)

**Steps:**
1. `curl -s http://localhost:3001/api/projects/1/plan`
2. Inspect `workflowState.reasons`

**Expected:**
- Reasons array contains a string matching `Workflow stack is <status> — <N> component(s) missing: <gap1>, <gap2>`
- Gap labels in the reason string match `readiness.gaps`

---

### TC-05: nextAction blockers include gap labels when required components missing

**Precondition:** At least one required component is missing

**Steps:**
1. `curl -s http://localhost:3001/api/projects/1/plan`
2. Inspect `nextAction.blockers`

**Expected:**
- `blockers` array includes the labels of all missing required components
- Labels match `readiness.gaps`

---

### TC-06: Workflow Readiness panel renders in cockpit

**Steps:**
1. Open cockpit at `http://localhost:5173` (or dev port)
2. Select project 1

**Expected:**
- Section heading "Workflow Readiness" is visible
- Overall readiness badge is visible (e.g., "Readiness: partial")
- Component list renders with at least one item
- Each item shows a ✓ or ✗ indicator and a label

---

### TC-07: Gaps section renders when gaps exist

**Precondition:** gaps.length > 0

**Steps:**
1. Open cockpit, select project 1
2. Locate the Workflow Readiness panel

**Expected:**
- A "Gaps" section is visible
- Each gap label is listed (e.g., "Holistic (tool)", "GSD (tool)")

---

### TC-08: No console errors in cockpit

**Steps:**
1. Open cockpit, select project 1
2. Open browser dev tools console

**Expected:**
- Zero JavaScript errors in the console
- Readiness panel renders without React key errors or prop type warnings

---

### TC-09: Edge case — repo with no .gsd dir

**Precondition:** A project registered with a rootPath that has no `.gsd/` directory

**Steps:**
1. Temporarily register or use a project pointing to a bare directory
2. `curl -s http://localhost:3001/api/projects/<id>/plan`
3. Inspect `readiness`

**Expected:**
- `overallReadiness` is `'missing'` (no required components present)
- `gaps` contains at minimum: 'GSD', 'GSD project doc', 'Holistic (repo)', 'Holistic (tool)', 'GSD (tool)'
- `workflowState.phase` is `'blocked'`
- `nextAction.action` contains bootstrap guidance

---

### TC-10: TypeScript types are clean

**Steps:**
1. `npx tsc --noEmit` from project root

**Expected:**
- Exit code 0
- Zero type errors
- `StackComponent`, `ReadinessReport`, and `readiness: ReadinessReport` on `ProjectPlan` are all valid

