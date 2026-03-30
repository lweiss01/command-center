---
id: S03
parent: M008
milestone: M008
provides:
  - Clean header action model as baseline for S04 polish pass.
requires:
  - slice: S01
    provides: Accepted criteria and deceptive CTA finding
affects:
  - S04
key_files:
  - src/App.tsx
key_decisions:
  - New Project demoted to disabled ghost to remove trust-break from a non-functional high-prominence CTA.
  - User Guide as muted text link keeps discoverability without visual competition with operational actions.
  - Scan Workspace is the sole filled primary CTA in the header.
patterns_established:
  - Three-level header action hierarchy: utility text link → ghost disabled → filled primary.
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M008/slices/S03/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T22:19:25.270Z
blocker_discovered: false
---

# S03: Action Hierarchy and In-App Onboarding Surface

**Established explicit three-level header action hierarchy: demoted dead-end New Project CTA, kept User Guide as quiet utility, promoted Scan Workspace as primary.**

## What Happened

S03 resolved the most trust-damaging UX issue from the S01 audit: a white filled primary CTA with no working flow. The header now has an explicit three-level hierarchy — utility, deemphasised-inactive, primary — that matches actual user workflow and sets accurate expectations for what's available.

## Verification

Build passes. Source confirms all three controls at correct hierarchy levels.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

New Project has no flow yet — the disabled state is a placeholder until that feature is built.

## Follow-ups

S04: consistent focus-visible system across all interactive controls; property-specific transitions; typography/spacing polish.

## Files Created/Modified

- `src/App.tsx` — Header action cluster redesigned with explicit hierarchy: utility link, disabled ghost, filled primary CTA.
