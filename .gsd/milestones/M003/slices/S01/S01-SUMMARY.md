---
id: S01
parent: M003
milestone: M003
provides:
  - Working apply endpoint for all repo-local bootstrap actions
  - Per-step confirmation UI pattern reusable in S03 (safe apply engine)
  - componentId threading from server plan → UI → apply POST
requires:
  []
affects:
  - S02
  - S03
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Machine-tool applies are rejected at the API layer (400) — no silent swallowing
  - Step state is fully cleared on successful apply to avoid positional ID collision with re-rendered plans
  - Confirmation panel is inline (not modal) per the plan spec
  - No persistent 'done' display — completed steps disappear from the plan when readiness updates, which is the correct UX signal
patterns_established:
  - Post-apply plan refresh pattern: clear all step state, then re-fetch loadProjectPlan — avoids stale positional ID issues
  - Machine-tool vs repo-local boundary enforced at both API (400 rejection) and UI (View Instructions vs Apply) layers
observability_surfaces:
  - [bootstrap/apply] server log line with project name, componentId, action, and result path on every apply
drill_down_paths:
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T01:21:10.481Z
blocker_discovered: false
---

# S01: Staged bootstrap planner (repo-first)

**Bootstrap plan is now executable: Apply button, inline confirmation, backend action, and live readiness update all wired end-to-end**

## What Happened

S01 turned the read-only bootstrap plan display into a live staged apply workflow. The backend apply endpoint handles all repo-local component types with idempotency and rejects machine-tool components explicitly. The UI adds per-step state tracking, an inline confirmation panel for repo-local steps (with rationale, risk, Confirm/Cancel), and a View Instructions panel for machine-level steps showing the install command as selectable code. On successful apply the plan re-fetches and the completed step disappears as readiness updates. The step ID stability issue was caught and fixed during T02: positional IDs are cleared before re-fetch rather than set to done.

## Verification

All three tasks verified: T01 via curl confirming gsd-dir creation and 400 rejection of machine-tool components. T02 via browser confirming Apply button, confirmation panel, Cancel restore, and successful apply with readiness update. T03 via browser_assert (3/3 checks pass) and network log confirming POST + plan re-fetch. Disk state verified: .gsd/ exists in filetrx repo post-apply.

## Requirements Advanced

- R001 — Bootstrap plan is now actionable, not just diagnostic — users can fix readiness gaps in one click

## Requirements Validated

None.

## New Requirements Surfaced

- Step IDs need to be stable across plan refreshes to support persistent done/skipped states in future slices — consider using componentId as the key instead of positional bp-N

## Requirements Invalidated or Re-scoped

None.

## Deviations

T01 was implemented in the previous session commit alongside computeBootstrapPlan (both shipped as part of the plan API work). T02 discovered a step-ID stability issue: positional bp-N IDs bleed stale state into re-rendered plans. Fixed by clearing all step state on successful apply before re-fetching rather than setting individual steps to 'done'.

## Known Limitations

View Instructions path (machine-level steps) could not be exercised in-browser because all local dev projects have holistic-tool and gsd-tool present. Code path is correct and the 400 rejection is verified via curl.

## Follow-ups

S02 (template-based bootstrap source + preview) and S03 (safe apply engine with dry-run) build on this foundation.

## Files Created/Modified

- `server.js` — Added BOOTSTRAP_STUBS, POST /api/projects/:id/bootstrap/apply endpoint, componentId+instructions fields on computeBootstrapPlan steps
- `src/App.tsx` — Added bootstrapStepStatus/Error state, handleBootstrapConfirm handler, per-step Apply/View Instructions buttons, inline confirmation and instructions panels, status indicators
