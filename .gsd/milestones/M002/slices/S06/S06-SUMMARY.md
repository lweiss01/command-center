---
id: S06
parent: M002
milestone: M002
provides:
  - Clear distinction between imported facts and interpreted conclusions in the repo-detail cockpit.
  - Inspectable provenance/freshness context for imported milestones, requirements, and decisions.
  - Compact epistemic markers on cross-repo portfolio signals.
requires:
  - slice: S01/S02/S03/S04/S05
    provides: Workflow interpretation, continuity, readiness, and open-loop surfaces that S06 now labels with explicit epistemic provenance.
affects:
  - S07
key_files:
  - src/App.tsx
  - .gsd/milestones/M002/slices/S06/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S06/tasks/T02-SUMMARY.md
key_decisions:
  - Keep trust-surface changes frontend-only in App.tsx with no backend/API contract changes.
  - Use compact inline wording/markers (`derived`/`interpreted` and `· interp`) to preserve cockpit density while making epistemic boundaries explicit.
patterns_established:
  - When a cockpit value is computed, subtitle/badge text should explicitly mark it as interpreted or derived.
  - Imported data headers should show freshness + source at point of use to avoid hidden provenance assumptions.
observability_surfaces:
  - Visible derivation/provenance subtitles on Workflow State, Workflow Readiness, Continuity, Next Action, and Open Loops.
  - Visible import freshness/source lines (`Last synced ... · source ...`) in Imported Milestones/Requirements/Decisions headers.
  - Visible interpreted marker (`· interp`) on portfolio phase and continuity badges.
drill_down_paths:
  - .gsd/milestones/M002/slices/S06/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S06/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:51:24.838Z
blocker_discovered: false
---

# S06: Trust and anti-hidden-state surfaces

**Made cockpit trust surfaces explicit by labeling interpreted outputs and surfacing import provenance timing/source.**

## What Happened

Executed two focused frontend tasks in `src/App.tsx` to reduce hidden-state ambiguity in the cockpit. T01 labeled all interpreted panels with explicit derivation language. T02 surfaced import provenance timing/source in imported-entity headers and marked portfolio phase/continuity badges as interpreted. Verification included type-checking, static string presence checks, and runtime UI confirmation in the browser.

## Verification

`npx tsc --noEmit` passed for both tasks. Runtime UI checks in browser confirmed interpreted marker and provenance text visibility after selecting a project.

## Requirements Advanced

- R001 — Made interpretation boundaries and provenance explicit in the cockpit UX, reducing opaque state presentation.

## Requirements Validated

- R001 — Browser-visible derivation labels across interpreted panels, import provenance lines in imported headers, and interpreted markers on portfolio phase/continuity badges; verified via TypeScript checks and runtime UI inspection.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

No direct one-click desktop launcher exists yet; startup still requires manual command execution.

## Follow-ups

Add a dedicated startup UX slice for one-click desktop launch of backend + frontend.

## Files Created/Modified

- `src/App.tsx` — Updated interpreted panel subtitles to explicit derivation/provenance wording and added import provenance helpers/rendering plus interpreted badge markers.
