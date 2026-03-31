---
id: S04
parent: M004
milestone: M004
provides:
  - Proof panel in cockpit
  - GET /proof endpoint for requirement traceability
  - Import Summaries button
requires:
  - slice: S03
    provides: proofSummary in plan response, proofLevel on milestones
affects:
  []
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Proof fetched in parallel with plan, non-fatal
  - Import Summaries button refreshes both plan and proof in one shot via loadProjectPlan
patterns_established:
  - Parallel non-fatal fetch for secondary data (proof) alongside primary plan fetch
observability_surfaces:
  - Proof panel visible in cockpit with proven/claimed counts
  - workflowState.evidence Proof entry in Workflow State panel
drill_down_paths:
  - .gsd/milestones/M004/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T04:14:14.577Z
blocker_discovered: false
---

# S04: Proof panel and requirement traceability in the cockpit

**Proof panel in cockpit — claimed vs proven milestones, requirement traceability, Import Summaries trigger**

## What Happened

S04 closes M004 by surfacing proof data in the cockpit. The Proof panel shows per-milestone claimed/proven status with checkmarks, summary counts, a one-click Import Summaries trigger, and a collapsible requirement proof section linking requirements to their slice-level evidence. The panel is positioned between Workflow State and Bootstrap Plan, giving it prominence as a trust signal.

## Verification

5/5 browser assertions. Build clean.

## Requirements Advanced

- R001 — Cockpit now shows claimed vs proven milestones and requirement proof links
- R013 — Proof panel directly surfaces the claimed-vs-proven distinction with evidence sources

## Requirements Validated

- R013 — Cockpit shows proven milestones with checkmarks, claimed milestones with circles, and requirement proof links with source SUMMARY titles — all derived from imported SUMMARY files

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

- `server.js` — GET /api/projects/:id/proof endpoint for requirement proof traceability
- `src/App.tsx` — Proof panel with milestone list, proof summary, import button, requirement proof links
