---
id: T02
parent: S02
milestone: M005
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["Health/proof shown on second subtitle line only when at least one value is present — avoids blank line for projects with no portfolio data yet", "Proof shown only when proofCoverage.total > 0 to avoid 0/0 noise"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Build clean. Cards show Health A for command-center, Health D for filetrx/paydirt-backend."
completed_at: 2026-03-31T16:05:39.463Z
blocker_discovered: false
---

# T02: Portfolio cards show Health A/B/C/D badge and proof coverage

> Portfolio cards show Health A/B/C/D badge and proof coverage

## What Happened
---
id: T02
parent: S02
milestone: M005
key_files:
  - src/App.tsx
key_decisions:
  - Health/proof shown on second subtitle line only when at least one value is present — avoids blank line for projects with no portfolio data yet
  - Proof shown only when proofCoverage.total > 0 to avoid 0/0 noise
duration: ""
verification_result: passed
completed_at: 2026-03-31T16:05:39.463Z
blocker_discovered: false
---

# T02: Portfolio cards show Health A/B/C/D badge and proof coverage

**Portfolio cards show Health A/B/C/D badge and proof coverage**

## What Happened

Updated PortfolioEntry interface with new fields. Added healthGradeColor helper. Updated portfolio card to show health grade letter (colored by grade) and proof coverage (N/total) on a second subtitle line below the existing Phase/Continuity row. Fixed duplicate phaseColor function that crept in during edit.

## Verification

Build clean. Cards show Health A for command-center, Health D for filetrx/paydirt-backend.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass — clean build | 8300ms |


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
