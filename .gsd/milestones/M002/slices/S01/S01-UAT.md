# S01: Workflow interpretation contract — UAT

**Milestone:** M002
**Written:** 2026-03-28T03:59:04.406Z

# S01 UAT: Workflow interpretation contract

## Preconditions

1. Backend running on port 3001: `node server.js` (or bridge already active)
2. Frontend running: `npm run dev` (Vite on port 5173 or similar)
3. Workspace has at minimum two discovered repos: one with full GSD artifacts (e.g. command-center itself) and one with no/minimal artifacts (e.g. a stub project with no `.gsd/`)
4. command-center repo has a valid `.holistic/state.json` with a `lastUpdated` timestamp

---

## Test Cases

### TC-01: workflowState API contract — data-rich repo
**Goal:** Confirm `GET /api/projects/:id/plan` returns the full structured workflowState shape.

Steps:
1. Identify the project ID for the command-center repo from `GET /api/projects`
2. `curl http://localhost:3001/api/projects/{id}/plan`
3. Inspect the `workflowState` field

Expected:
- `phase` is one of: `'no-data' | 'import-only' | 'active' | 'stalled' | 'blocked'`
- `confidence` is a number between 0 and 1 inclusive
- `reasons` is an array (may be empty if confidence = 1)
- `evidence` is an array of `{label, value}` objects with at least one item for a data-rich repo

---

### TC-02: workflowState phase for a repo with no GSD artifacts
**Goal:** Confirm `phase: 'no-data'` and `confidence: 0` for a sparse repo.

Steps:
1. Find a discovered project with no milestones, requirements, or decisions imported
2. `curl http://localhost:3001/api/projects/{id}/plan`
3. Inspect `workflowState`

Expected:
- `phase: 'no-data'`
- `confidence: 0`
- `reasons` array is non-empty (lists what is missing)
- `evidence` array is empty or contains only zero-value items

---

### TC-03: continuity API contract — repo with Holistic state.json
**Goal:** Confirm `continuity` returns structured fields when `.holistic/state.json` exists.

Steps:
1. Ensure command-center has `.holistic/state.json` with a `lastUpdated` key
2. `curl http://localhost:3001/api/projects/{id}/plan`
3. Inspect the `continuity` field

Expected:
- `status` is one of: `'fresh' | 'stale' | 'missing'`
- `freshAt` is an ISO timestamp string (not null)
- `ageHours` is a non-negative number
- `latestWork` is a string or null
- `checkpointHygiene` is one of: `'ok' | 'stale' | 'missing'`
- `hygieneNote` is a string or null

---

### TC-04: continuity API contract — repo without Holistic state.json
**Goal:** Confirm `continuity` returns `status: 'missing'` and all nullable fields are null.

Steps:
1. Find a discovered project without `.holistic/state.json`
2. `curl http://localhost:3001/api/projects/{id}/plan`
3. Inspect `continuity`

Expected:
- `status: 'missing'`
- `freshAt: null`
- `ageHours: null`
- `latestWork: null`
- `checkpointHygiene: 'missing'`
- `hygieneNote: null`

---

### TC-05: nextAction API contract — clear path
**Goal:** Confirm `nextAction` returns directive action text and empty blockers for a healthy repo.

Steps:
1. Use the command-center project (data-rich, fresh continuity)
2. `curl http://localhost:3001/api/projects/{id}/plan`
3. Inspect `nextAction`

Expected:
- `action` is a non-empty string starting with an imperative verb
- `rationale` is a non-empty explanatory string
- `blockers` is an empty array `[]`

---

### TC-06: nextAction blockers for a repo with missing continuity
**Goal:** Confirm blockers are populated with context-rich text when continuity is missing.

Steps:
1. Use a repo with no `.holistic/state.json`
2. `curl http://localhost:3001/api/projects/{id}/plan`
3. Inspect `nextAction.blockers`

Expected:
- `blockers` is a non-empty array
- At least one entry mentions continuity or Holistic (contains 'continuity' or 'holistic' case-insensitively)

---

### TC-07: Cockpit renders workflow state panel
**Goal:** Confirm the cockpit shows structured workflow state for a selected repo.

Steps:
1. Open the frontend in a browser
2. Select the command-center repo from the project list
3. Inspect the Workflow State section

Expected:
- Phase badge is visible and shows a phase label (e.g. "active")
- Confidence is displayed as a percentage or indicator
- At least one evidence item row is visible
- No console errors in browser devtools

---

### TC-08: Cockpit renders continuity panel
**Goal:** Confirm the continuity panel shows structured fields.

Steps:
1. With command-center selected (has Holistic state.json)
2. Inspect the Continuity section

Expected:
- Status badge visible (fresh/stale/missing)
- Checkpoint hygiene badge visible
- Age or timestamp shown
- Latest work entry shown (if available)

---

### TC-09: Cockpit renders next action panel
**Goal:** Confirm the next action panel shows directive text and conditional blockers.

Steps:
1. With command-center selected
2. Inspect the Next Action section

Expected:
- Action sentence visible and starts with an imperative verb
- Rationale text visible
- Clear/Blocked badge visible
- Blockers section only appears when blockers[] is non-empty

---

### TC-10: No console errors on load for any repo including sparse repos
**Goal:** Confirm zero JavaScript console errors across repo types.

Steps:
1. Select a data-rich repo (command-center) → observe console
2. Select a sparse repo (no GSD artifacts, no Holistic) → observe console
3. Select any additional discovered repos

Expected:
- Zero `[Error]` or `[Uncaught]` console entries for each selection
- UI degrades gracefully (shows "missing" status, empty panels) rather than crashing

---

### TC-11: TypeScript compiles clean
**Goal:** Confirm no type errors after all S01 changes.

Steps:
1. `cd command-center && npx tsc --noEmit`

Expected:
- Exit code 0
- Zero type errors

