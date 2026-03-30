---
id: T01
parent: S02
milestone: M008
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["Used 'Plan:', 'Phase:', 'Continuity:' as dimension prefixes for all card chips.", "Replaced card div with semantic button type=button to fix interaction semantics.", "Dropped '· interp' shorthand entirely — no abbreviations or insider jargon on cards."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Build passes (npm run build, exit 0). Source grep confirms Phase:/Continuity:/Plan: labels present and no '· interp' or cursor-pointer remains. Card container is button[type=button] at line 679."
completed_at: 2026-03-28T22:13:57.742Z
blocker_discovered: false
---

# T01: Replaced ambiguous card pills with explicitly labeled semantic chips and converted card containers to semantic buttons.

> Replaced ambiguous card pills with explicitly labeled semantic chips and converted card containers to semantic buttons.

## What Happened
---
id: T01
parent: S02
milestone: M008
key_files:
  - src/App.tsx
key_decisions:
  - Used 'Plan:', 'Phase:', 'Continuity:' as dimension prefixes for all card chips.
  - Replaced card div with semantic button type=button to fix interaction semantics.
  - Dropped '· interp' shorthand entirely — no abbreviations or insider jargon on cards.
duration: ""
verification_result: passed
completed_at: 2026-03-28T22:13:57.742Z
blocker_discovered: false
---

# T01: Replaced ambiguous card pills with explicitly labeled semantic chips and converted card containers to semantic buttons.

**Replaced ambiguous card pills with explicitly labeled semantic chips and converted card containers to semantic buttons.**

## What Happened

Updated project cards in src/App.tsx to use explicitly labeled semantic chips. Phase and Continuity chips now prefix their values with dimension labels. Plan Status chip adds a 'Plan:' prefix. Removed the ambiguous '· interp' shorthand from all card chips. Changed the card container from a clickable div to a semantic button[type=button] with text-left alignment and transition-colors (not transition-all). Build passed cleanly.

## Verification

Build passes (npm run build, exit 0). Source grep confirms Phase:/Continuity:/Plan: labels present and no '· interp' or cursor-pointer remains. Card container is button[type=button] at line 679.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 4100ms |
| 2 | `rg -n "Phase:|Continuity:|Plan:" src/App.tsx` | 0 | ✅ pass — all three labels present | 200ms |
| 3 | `rg -n "interp|cursor-pointer" src/App.tsx` | 1 | ✅ pass — no matches (shorthand fully removed) | 150ms |


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
