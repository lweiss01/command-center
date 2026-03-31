---
id: S04
parent: M005
milestone: M005
provides:
  - Repair queue UI in Health panel with severity badges and target panel labels
requires:
  - slice: S03
    provides: repairQueue in plan response, Health panel structure
affects:
  []
key_files:
  - src/App.tsx
key_decisions:
  - Critical items get danger border for visual distinction
  - Target panel as muted label (not real link) since everything is on one scrollable page
patterns_established:
  - Critical items get border highlight to differentiate from high/medium severity
observability_surfaces:
  - Repair queue visible in Health panel for any repo with issues
drill_down_paths:
  - .gsd/milestones/M005/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T16:14:35.053Z
blocker_discovered: false
---

# S04: Repair queue in Health panel

**Repair queue completes the health-to-repair loop in the Health panel**

## What Happened

S04 closes the health-to-repair loop. The repair queue renders inside the Health panel with prioritized items showing severity (critical=danger border+pill, high=warn, medium=info, low=muted), the action text, rationale, and target panel label. Healthy repos show '✓ No repairs needed'. The full M005 user story is now complete: portfolio cards show health at a glance, the Health panel shows what's wrong and in what order to fix it.

## Verification

Browser 5/5 + 2/2 verified. Build clean. No regressions.

## Requirements Advanced

- R005 — Repair queue tells the user exactly what to fix and where to go
- R002 — Full health loop closes: portfolio card → health panel → repair queue → action

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `src/App.tsx` — Repair queue UI added to Health panel below contributor breakdown
