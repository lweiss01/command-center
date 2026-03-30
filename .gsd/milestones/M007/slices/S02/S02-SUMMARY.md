---
id: S02
parent: M007
milestone: M007
provides:
  - Faster transition from signal to action in Next Action panel.
  - Regression-safe interpreted/provenance label visibility checks.
  - Synchronized app footer version display tied to release metadata.
requires:
  - slice: S01
    provides: Launcher hardening and diagnostics from S01 that support suggested-command flow (`cc:doctor`).
affects:
  []
key_files:
  - src/App.tsx
  - vite.config.ts
  - src/globals.d.ts
  - package.json
  - .gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S02/tasks/T02-SUMMARY.md
key_decisions:
  - Use context-derived command affordance in Next Action panel (`npm run cc:doctor` for tool/readiness blockers).
  - Preserve interpreted/provenance subtitle language while increasing actionability emphasis.
  - Drive footer version from package.json via build-time define rather than hardcoded UI text.
patterns_established:
  - Action surfaces should pair recommendation text with an immediately runnable command when possible.
  - Trust/provenance labels must remain visible when iterating cockpit usability.
  - App version should be sourced from package metadata, not hardcoded in UI.
observability_surfaces:
  - Visible `Suggested command` and blocker-count callout in Next Action panel.
  - Browser assertion evidence for interpreted/provenance subtitle presence.
  - Footer version text now reflects package version (`L.W. Hub v1.0.0`).
drill_down_paths:
  - .gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T18:51:18.944Z
blocker_discovered: false
---

# S02: Cockpit feature iteration

**Improved cockpit Next Action actionability and retained explicit trust surfaces, with package-driven footer versioning verified in UI.**

## What Happened

S02 delivered cockpit actionability improvements while preserving trust surfaces. T01 refined Next Action with stronger blocker emphasis and an explicit suggested-command affordance. T02 verified blocked-state actionability and re-verified interpreted/provenance labels across interpreted panels with deterministic browser assertions. During this slice, footer versioning was also wired to package.json and validated in browser (`L.W. Hub v1.0.0`).

## Verification

`npx tsc --noEmit` passed. Browser assertions passed for blocked-state actionability and interpreted/provenance labels. Footer version assertion passed for `L.W. Hub v1.0.0`.

## Requirements Advanced

- R001 — Improved usability and trust clarity by making Next Action execution more direct and keeping provenance labels explicit while introducing package-driven version visibility.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T02 clear-state UI assertion could not run because current dataset has no clear-state repos (`clear=0`); documented with API evidence.

## Known Limitations

Clear-state Next Action browser assertion is pending future dataset/fixture state; current local plans are all blocked.

## Follow-ups

When a clear-state project becomes available (or dedicated fixture is added), add explicit clear-state browser assertion evidence to complement current blocked-state checks.

## Files Created/Modified

- `src/App.tsx` — Improved Next Action actionability with suggested command affordance and stronger blocker callout.
- `src/App.tsx` — Connected footer version text to package-driven app version constant via Vite define.
- `vite.config.ts` — Injected build-time `__APP_VERSION__` from package.json.
- `src/globals.d.ts` — Added global type declaration for injected app version constant.
- `package.json` — Bumped app version to 1.0.0.
