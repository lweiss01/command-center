---
id: S05
parent: M001
milestone: M001
provides:
  - Imported requirement rows and cockpit rendering for S07 import UX
requires:
  - slice: S03
    provides: Canonical requirements table and plan endpoint
affects:
  - S07
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Parser extracts requirement ID, status, class, description, notes from structured REQUIREMENTS.md sections.
patterns_established:
  - (none)
observability_surfaces:
  - Imported requirements panel with status badges (active/validated/deferred)
drill_down_paths:
  - .gsd/milestones/M001/slices/S05/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:34:16.261Z
blocker_discovered: false
---

# S05: Requirements import

**Requirements parser, import route, provenance, and cockpit panel extend the canonical import pattern to capability contract data.**

## What Happened

parseGsdRequirements reads .gsd/REQUIREMENTS.md structured sections. importGsdRequirements upserts rows into requirements with import_runs and evidence_links. Cockpit renders imported requirements panel. Verified live: 20 requirements imported from this repo's own .gsd/REQUIREMENTS.md.

## Verification

POST /api/projects/1/import/requirements: 20 imported. Cockpit rendered requirement rows. M001-VALIDATION.md: PASS.

## Requirements Advanced

- R007 — Live import of 20 requirements from .gsd/REQUIREMENTS.md proves the capability contract is docs-first.

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

- `server.js` — parseGsdRequirements, importGsdRequirements, POST /api/projects/:id/import/requirements
- `src/App.tsx` — handleImportRequirements, imported requirements panel
