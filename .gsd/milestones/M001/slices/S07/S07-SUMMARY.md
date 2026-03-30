---
id: S07
parent: M001
milestone: M001
provides:
  - Complete import-first cockpit surface for M002 to extend
requires:
  - slice: S04
    provides: Imported milestone rows and cockpit panel
  - slice: S05
    provides: Imported requirement rows and cockpit panel
  - slice: S06
    provides: Imported decision rows and cockpit panel
affects:
  []
key_files:
  - src/App.tsx
  - server.js
key_decisions:
  - Import controls and workflow state kept explainable and visibly secondary to repo docs per R008.
patterns_established:
  - Import trigger → POST route → refresh plan snapshot as the cockpit update cycle
observability_surfaces:
  - Import run summary panels with warning counts
  - Workflow state, continuity freshness, and next action panels in cockpit
drill_down_paths:
  - .gsd/milestones/M001/slices/S07/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:34:44.347Z
blocker_discovered: false
---

# S07: Import UX and validation

**Import controls, warning surfaces, and first-pass cockpit UX make the foundation usable and honest with no console errors.**

## What Happened

App.tsx exposes import trigger buttons for milestones, requirements, and decisions. Import run summaries and warning states surface after each import. Re-imports upsert cleanly without stale row accumulation. computeWorkflowState, computeContinuity, computeNextAction provide first-pass explainable signals. Verified live: cockpit loaded with zero console errors and zero failed requests; all panels rendered correctly.

## Verification

Browser: no console errors, no failed network requests. Import panels, workflow state, continuity, next action all rendered. M001-VALIDATION.md: PASS WITH CAVEAT.

## Requirements Advanced

- R008 — Import controls and warning surfaces keep internal state visible and explainable.

## Requirements Validated

- R007 — Cockpit renders imported milestones, requirements, and decisions from repo-local .gsd docs with no console or network errors verified live.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Richer review/confidence semantics intentionally deferred — this is a documented M001 caveat, not a gap.

## Known Limitations

Richer review/confidence UX beyond first-pass surfaces intentionally deferred to later milestones.

## Follow-ups

Richer review/confidence UX belongs to M002+.

## Files Created/Modified

- `server.js` — computeWorkflowState, computeContinuity, computeNextAction, import warning surfaces, stale-row upsert on re-import
- `src/App.tsx` — Import trigger buttons, warning panels, workflow state, continuity freshness, next action panel
