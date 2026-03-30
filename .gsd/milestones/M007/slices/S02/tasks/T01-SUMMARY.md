---
id: T01
parent: S02
milestone: M007
provides: []
requires: []
affects: []
key_files: ["src/App.tsx", ".gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md"]
key_decisions: ["Use contextual command derivation to surface a compact suggested command only when actionable.", "Strengthen blocker visibility with a dedicated callout and blocker-count badge while preserving existing provenance copy."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "`npx tsc --noEmit` passed. Browser assertions passed for `Next Action`, `Suggested command`, `Blockers`, and `npm run cc:doctor` visibility after selecting a repo."
completed_at: 2026-03-28T18:34:00.453Z
blocker_discovered: false
---

# T01: Improved Next Action actionability with suggested command affordance and stronger blocker emphasis.

> Improved Next Action actionability with suggested command affordance and stronger blocker emphasis.

## What Happened
---
id: T01
parent: S02
milestone: M007
key_files:
  - src/App.tsx
  - .gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md
key_decisions:
  - Use contextual command derivation to surface a compact suggested command only when actionable.
  - Strengthen blocker visibility with a dedicated callout and blocker-count badge while preserving existing provenance copy.
duration: ""
verification_result: passed
completed_at: 2026-03-28T18:34:00.456Z
blocker_discovered: false
---

# T01: Improved Next Action actionability with suggested command affordance and stronger blocker emphasis.

**Improved Next Action actionability with suggested command affordance and stronger blocker emphasis.**

## What Happened

Refined the Next Action panel in `src/App.tsx` to increase execution clarity. Added derived state for blockers and suggested command text, introduced a `Suggested command` callout (`npm run cc:doctor` in blocked tool-readiness cases), and upgraded blocker presentation into a stronger red callout with a count badge. The interpreted provenance subtitle remained unchanged.

## Verification

`npx tsc --noEmit` passed. Browser assertions passed for `Next Action`, `Suggested command`, `Blockers`, and `npm run cc:doctor` visibility after selecting a repo.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 5200ms |
| 2 | `Browser assertions for Next Action blocker visibility + command affordance` | 0 | ✅ pass | 2500ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/App.tsx`
- `.gsd/milestones/M007/slices/S02/tasks/T01-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
