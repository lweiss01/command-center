---
id: S02
parent: M006
milestone: M006
provides:
  - POST `/api/projects/add` endpoint
  - Working 'New' button in UI
requires:
  - slice: S01
    provides: autoImportForProject for immediate population
affects:
  - S03
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Add-project auto-imports GSD docs immediately if present, so the project appears fully populated in the UI right away.
  - Add form is inline below the 'New' button to keep UI compact and avoid modals.
patterns_established:
  - Inline expanding forms for sidebar actions instead of modals
observability_surfaces:
  - `[project/add]` server log on successful addition
drill_down_paths:
  - .gsd/milestones/M006/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M006/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T22:12:16.906Z
blocker_discovered: false
---

# S02: Add project by path

**Enabled adding projects by directory path with auto-import**

## What Happened

S02 enables the user to add a specific project by directory path without waiting for a full workspace scan. The new POST `/api/projects/add` endpoint validates the path, upserts the project, and automatically runs `autoImportForProject` (from S01). The UI was updated to replace the disabled "New" button with an interactive toggle that shows an inline input form. Form handles enter/escape keys and displays validation errors clearly. Verified working with valid and invalid paths.

## Verification

API endpoint validated manually and via UI. Browser verified handling invalid paths correctly.

## Requirements Advanced

- R001 — Reduces friction to bring a new repo into the cockpit.

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

- `server.js` — POST /api/projects/add endpoint
- `src/App.tsx` — New button converted to inline add-project form
