---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: Per-step confirmation dialog + apply wiring in UI

Add per-step state to App.tsx to track { stepStatus: 'pending' | 'confirming' | 'applying' | 'done' | 'failed', stepError: string | null } keyed by step.id.

Add an Apply button to each bootstrap step card. Clicking it sets that step to 'confirming' and shows an inline confirmation panel (not a modal) directly below the step with: title, rationale, risk pill, what will happen, and Confirm / Cancel buttons.

On Confirm: set status to 'applying', POST to /api/projects/:id/bootstrap/apply with { componentId: step.sourceGap... wait — sourceGap is the label string. T01 endpoint uses componentId. Need to include componentId in the step shape from computeBootstrapPlan. Thread the component id through the step object so the UI can send it.

Actually: update computeBootstrapPlan in server.js to include componentId on each step (copy from the component's id field). Then UI sends { componentId: step.componentId }.

On success: set status to 'done', re-fetch the project plan so readiness updates.
On failure: set status to 'failed', show step.stepError inline.

Machine-level steps: Apply button instead shows 'View Instructions' which expands an instructions panel with the install command as a copyable code block. No POST is made.

## Inputs

- `server.js — computeBootstrapPlan`
- `src/App.tsx — bootstrap plan section, loadProjectPlan`

## Expected Output

- `Bootstrap steps have Apply/View Instructions buttons`
- `Inline confirmation panel appears before any action`
- `Step transitions through pending→confirming→applying→done/failed`
- `Plan re-fetches after successful apply`

## Verification

Browser: open a project with a missing .gsd dir. Click Apply on the GSD step. Confirm the confirmation panel appears. Click Confirm. Verify the step shows 'done' and the readiness section updates to show .gsd as present.
