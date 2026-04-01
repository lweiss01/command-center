---
id: S03
parent: M006
milestone: M006
provides:
  - `POST /api/projects/:id/import-all` endpoint
  - First-run onboarding card in project detail UI
requires:
  - slice: S01
    provides: autoImportForProject pattern context
affects:
  []
key_files:
  - src/App.tsx
  - server.js
key_decisions:
  - Onboarding card placed at the very top, before Next Action, so it is impossible to miss.
  - Import All endpoint uses try/catch blocks for each individual import so a failure in one (e.g. malformed JSON) doesn't break the others.
patterns_established:
  - Unified multi-action endpoint (`/import-all`) aggregating existing single-action ones gracefully.
observability_surfaces:
  - `[import-all]` network call visible, and UI loading state `Importing...` displayed
drill_down_paths:
  - .gsd/milestones/M006/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M006/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T22:55:58.521Z
blocker_discovered: false
---

# S03: First-run onboarding card

**Added first-run onboarding card with 'Import All' button for unpopulated projects**

## What Happened

S03 resolves the friction of populating a newly discovered project that has GSD planning documents but hasn't yet run any imports. Previously, users had to click three separate import buttons at the bottom of the page. Now, an onboarding card appears at the very top of the detail view with a single 'Import All' button. This button hits a new POST `/api/projects/:id/import-all` endpoint that safely runs all relevant imports and refreshes the UI. Verified successfully in the browser.

## Verification

Tested end-to-end via browser. Clean build. UI correctly hides the card when data is populated.

## Requirements Advanced

- R009 — Simplifies getting a repo into a 'ready' and 'active' state.

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

- `server.js` — POST /api/projects/:id/import-all endpoint added
- `src/App.tsx` — Onboarding card UI rendered dynamically when no imports exist, plus handleImportAll
