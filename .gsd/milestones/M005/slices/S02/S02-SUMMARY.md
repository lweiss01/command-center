---
id: S02
parent: M005
milestone: M005
provides:
  - healthScore/healthGrade/proofCoverage/importAgeDays in portfolio entries
  - Health + Proof line on portfolio cards
  - computeUrgencyScore accepts repoHealth
requires:
  - slice: S01
    provides: computeRepoHealth and computeRepairQueue functions
affects:
  - S03
  - S04
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Grade-aware urgency: D+0.20, C+0.10, A-0.10 (floored 0) replaces flat readiness-gap check
  - Health row on cards shown only when data available — no blank lines for unchecked repos
patterns_established:
  - Grade-aware urgency adjustment pattern: health grade D/C/A adjusts urgency score up/neutral/down
observability_surfaces:
  - Portfolio cards: Health A/B/C/D + Proof N/total visible at a glance
drill_down_paths:
  - .gsd/milestones/M005/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M005/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T16:06:10.212Z
blocker_discovered: false
---

# S02: Portfolio upgrade — health in cards and portfolio route

**Portfolio cards upgraded with health grade and proof coverage; urgency scoring is health-aware**

## What Happened

S02 surfaced health in the portfolio. Cards now show a second info line with grade letter (color-coded A=green, B=teal, C=amber, D=red) and proof coverage. Urgency scoring is health-aware. Portfolio API carries full health breakdown for S03/S04 to use in the plan response.

## Verification

Build clean. Browser 4/4. API confirmed all new portfolio fields.

## Requirements Advanced

- R002 — Portfolio cards now show health grade and proof coverage — enough to choose which repo deserves time without opening each one

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

- `server.js` — portfolio route computes health + urgency update; computeUrgencyScore grade-aware
- `src/App.tsx` — PortfolioEntry interface updated; healthGradeColor helper; health/proof on cards
