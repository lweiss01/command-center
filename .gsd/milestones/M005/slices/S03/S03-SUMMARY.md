---
id: S03
parent: M005
milestone: M005
provides:
  - repoHealth in plan response
  - repairQueue in plan response
  - Health panel in cockpit
requires:
  - slice: S01
    provides: computeRepoHealth and computeRepairQueue
  - slice: S02
    provides: health data in portfolio entries
affects:
  - S04
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Large grade letter (28px) as primary visual anchor in Health panel
  - Progress bar fill shows contribution/maxContribution ratio for each signal
patterns_established:
  - Contributor breakdown pattern: signal, label, colored dot, progress bar, note — reusable for any additive score
observability_surfaces:
  - Health panel in cockpit: grade + score + contributor breakdown
  - repoHealth and repairQueue in plan API response
drill_down_paths:
  - .gsd/milestones/M005/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T16:11:07.746Z
blocker_discovered: false
---

# S03: Health panel in repo detail

**Health panel live in cockpit — grade A for command-center, grade D with 4 signals for paydirt-backend**

## What Happened

S03 wired health into the plan response and rendered it in the cockpit. The Health panel sits between Proof and Bootstrap Plan, showing a large grade letter, percentage score, attention count, and a per-contributor row with colored dot, progress bar, and note. Both healthy (A) and degraded (D) repos render correctly with appropriate signals.

## Verification

Browser verified both repos. API confirmed plan response includes repoHealth and repairQueue.

## Requirements Advanced

- R005 — Health panel shows what is stale/missing per-signal in one place
- R001 — Health score + breakdown gives a single inspectable summary of repo operating state

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

- `server.js` — repoHealth and repairQueue added to plan route response
- `src/App.tsx` — HealthBreakdownItem/RepoHealth/RepairItem types, ProjectPlan updated, Health panel section
