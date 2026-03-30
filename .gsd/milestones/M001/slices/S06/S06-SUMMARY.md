---
id: S06
parent: M001
milestone: M001
provides:
  - Imported decision rows and cockpit rendering for S07 import UX
requires:
  - slice: S03
    provides: Canonical decisions table and plan endpoint
affects:
  - S07
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Parser reads DECISIONS.md table rows; scope, choice, rationale, revisable, made_by all preserved.
patterns_established:
  - (none)
observability_surfaces:
  - Imported decisions panel with scope, choice, rationale, revisable fields
drill_down_paths:
  - .gsd/milestones/M001/slices/S06/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:34:25.627Z
blocker_discovered: false
---

# S06: Decisions import

**Decisions parser, import route, provenance, and cockpit panel complete the three-entity canonical import set.**

## What Happened

parseGsdDecisions reads .gsd/DECISIONS.md table rows. importGsdDecisions upserts into decisions with import_runs and evidence_links. Cockpit renders imported decisions panel with scope and rationale. Verified live: 4 decisions imported (now 5 after D005 added this session).

## Verification

POST /api/projects/1/import/decisions: 4 imported. Cockpit rendered decision rows. M001-VALIDATION.md: PASS.

## Requirements Advanced

- R008 — Live import of architectural decisions from .gsd/DECISIONS.md keeps the canonical model subordinate to repo-local truth.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. Retroactive completion.

## Known Limitations

None beyond M001 scope.

## Follow-ups

None.

## Files Created/Modified

- `server.js` — parseGsdDecisions, importGsdDecisions, POST /api/projects/:id/import/decisions
- `src/App.tsx` — handleImportDecisions, imported decisions panel
