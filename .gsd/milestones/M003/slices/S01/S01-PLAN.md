# S01: Staged bootstrap planner (repo-first)

**Goal:** Add an execution layer to the existing bootstrap plan UI: per-step confirmation dialogs, a backend apply engine that performs the actual repo-local and machine-level actions, and visible per-step status feedback (pending → confirming → applying → done/failed).
**Demo:** After this: After this: for a selected repo, Command Center can generate a staged bootstrap plan from current readiness gaps, prioritizing repo-local actions and showing why each step matters.

## Tasks
- [x] **T01: Implemented POST /api/projects/:id/bootstrap/apply endpoint handling all repo-local and machine-tool cases** — Add POST /api/projects/:id/bootstrap/apply to server.js. Accepts { stepId, componentId } in the body. Looks up the component by id from computeReadiness, validates the action is repo-local (kind: repo-dir or repo-doc), then performs the appropriate action:
- gsd-dir: create .gsd/ directory
- holistic-dir: run `holistic init` in the project root
- gsd-doc-project: create stub .gsd/PROJECT.md
- gsd-doc-requirements: create stub .gsd/REQUIREMENTS.md
- gsd-doc-decisions: create stub .gsd/DECISIONS.md
- gsd-doc-knowledge: create stub .gsd/KNOWLEDGE.md
- gsd-doc-preferences: create stub .gsd/preferences.md
Returns { ok: true, componentId, action, path } on success or { ok: false, error } on failure. Machine-tool kind is rejected with 400 — those are instructions-only.
  - Estimate: 45m
  - Files: server.js
  - Verify: PowerShell: Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/projects/1/bootstrap/apply -Body '{"componentId":"gsd-dir"}' -ContentType application/json — confirm .gsd dir is created in the test project root, response is { ok: true }. Then confirm a machine-tool componentId returns 400.
- [x] **T02: Added per-step Apply/Confirm/Cancel and View Instructions UI with inline panels and live status feedback** — Add per-step state to App.tsx to track { stepStatus: 'pending' | 'confirming' | 'applying' | 'done' | 'failed', stepError: string | null } keyed by step.id.

Add an Apply button to each bootstrap step card. Clicking it sets that step to 'confirming' and shows an inline confirmation panel (not a modal) directly below the step with: title, rationale, risk pill, what will happen, and Confirm / Cancel buttons.

On Confirm: set status to 'applying', POST to /api/projects/:id/bootstrap/apply with { componentId: step.sourceGap... wait — sourceGap is the label string. T01 endpoint uses componentId. Need to include componentId in the step shape from computeBootstrapPlan. Thread the component id through the step object so the UI can send it.

Actually: update computeBootstrapPlan in server.js to include componentId on each step (copy from the component's id field). Then UI sends { componentId: step.componentId }.

On success: set status to 'done', re-fetch the project plan so readiness updates.
On failure: set status to 'failed', show step.stepError inline.

Machine-level steps: Apply button instead shows 'View Instructions' which expands an instructions panel with the install command as a copyable code block. No POST is made.
  - Estimate: 60m
  - Files: server.js, src/App.tsx
  - Verify: Browser: open a project with a missing .gsd dir. Click Apply on the GSD step. Confirm the confirmation panel appears. Click Confirm. Verify the step shows 'done' and the readiness section updates to show .gsd as present.
- [x] **T03: End-to-end browser verification passed: Apply, confirmation, cancel, confirm, disk write, readiness update all working** — End-to-end browser verification:
1. Pick a test repo with at least one repo-local gap and one machine-tool gap
2. Verify Apply button appears on repo-local steps, View Instructions on machine-tool steps
3. Walk through a repo-local apply: confirm dialog shows correct info, confirm executes, step shows done, readiness updates
4. Walk through machine-level: instructions panel shows correct install command, no auto-execution
5. Verify cancelling confirmation leaves repo unchanged
6. Verify a second apply on an already-present component is handled gracefully (either button is hidden or returns ok:true idempotently)
  - Estimate: 20m
  - Verify: All browser_assert checks pass. No console errors. Repo state on disk matches UI state.
