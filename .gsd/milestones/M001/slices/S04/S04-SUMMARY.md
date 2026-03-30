---
id: S04
parent: M001
milestone: M001
provides:
  - Imported milestone rows and cockpit rendering for S07 import UX
requires:
  - slice: S03
    provides: Canonical milestones table and plan endpoint
affects:
  - S07
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Parser targets .gsd/PROJECT.md milestone checklist format; conservative and format-sensitive by design.
patterns_established:
  - parse → upsert → import_run → evidence_link as the canonical import pattern for all entity types
observability_surfaces:
  - import_runs row per import with warnings_json
  - Imported milestones panel in cockpit
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:34:07.415Z
blocker_discovered: false
---

# S04: Milestone import

**Milestone parser, import route, provenance, and cockpit panel ship the first full docs-to-cockpit import path.**

## What Happened

parseGsdProjectMilestones reads .gsd/PROJECT.md checklist. importGsdProjectMilestones upserts milestone rows with import_runs and evidence_links. Cockpit renders imported milestone panel. Verified live: 6 milestones imported from this repo's own .gsd/PROJECT.md.

## Verification

POST /api/projects/1/import/milestones: 6 imported. Cockpit rendered milestone rows. M001-VALIDATION.md: PASS.

## Requirements Advanced

- R007 — Live import of 6 milestones from .gsd/PROJECT.md proves docs-first import works end-to-end.

## Requirements Validated

- R007 — 6 milestones imported live from .gsd/PROJECT.md and rendered in cockpit through the real app path.

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

- `server.js` — parseGsdProjectMilestones, importGsdProjectMilestones, POST /api/projects/:id/import/milestones
- `src/App.tsx` — handleImportMilestones, imported milestones panel
