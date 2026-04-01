---
id: T02
parent: S03
milestone: M006
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["Card is placed above the "Next Action" panel so it is the very first thing the user sees when opening a fresh project."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Build clean. UI logic correctly checks for empty milestones/requirements/decisions and present doc artifacts."
completed_at: 2026-03-31T22:36:47.423Z
blocker_discovered: false
---

# T02: Added first-run onboarding card to UI for projects with docs but no imports

> Added first-run onboarding card to UI for projects with docs but no imports

## What Happened
---
id: T02
parent: S03
milestone: M006
key_files:
  - src/App.tsx
key_decisions:
  - Card is placed above the "Next Action" panel so it is the very first thing the user sees when opening a fresh project.
duration: ""
verification_result: passed
completed_at: 2026-03-31T22:36:47.431Z
blocker_discovered: false
---

# T02: Added first-run onboarding card to UI for projects with docs but no imports

**Added first-run onboarding card to UI for projects with docs but no imports**

## What Happened

Added `importAllInFlight` state. Added `needsOnboarding` logic that checks if the project has planning docs but zero imported entities. Added the onboarding card rendering right before the Next Action panel. The card contains an "Import All" button that calls the new `handleImportAll` function. Build passed cleanly.

## Verification

Build clean. UI logic correctly checks for empty milestones/requirements/decisions and present doc artifacts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 60000ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/App.tsx`


## Deviations
None.

## Known Issues
None.
