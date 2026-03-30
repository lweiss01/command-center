---
id: T02
parent: S05
milestone: M002
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["IIFE pattern used for per-card portfolio badge rendering to keep inline logic readable without extracting a separate component", "portfolioLoading skeleton only shown when loading AND entry not yet in map, preventing flicker on re-renders", "filteredProjects useMemo spreads into new array before sort to avoid mutating the filtered result in place"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit exited 0 with no output."
completed_at: 2026-03-28T17:04:35.412Z
blocker_discovered: false
---

# T02: Added PortfolioEntry interface, lazy /api/portfolio fetch, phase/continuity/gaps badges on project cards, skeleton loading state, and urgency/name sort toggle

> Added PortfolioEntry interface, lazy /api/portfolio fetch, phase/continuity/gaps badges on project cards, skeleton loading state, and urgency/name sort toggle

## What Happened
---
id: T02
parent: S05
milestone: M002
key_files:
  - src/App.tsx
key_decisions:
  - IIFE pattern used for per-card portfolio badge rendering to keep inline logic readable without extracting a separate component
  - portfolioLoading skeleton only shown when loading AND entry not yet in map, preventing flicker on re-renders
  - filteredProjects useMemo spreads into new array before sort to avoid mutating the filtered result in place
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:04:35.415Z
blocker_discovered: false
---

# T02: Added PortfolioEntry interface, lazy /api/portfolio fetch, phase/continuity/gaps badges on project cards, skeleton loading state, and urgency/name sort toggle

**Added PortfolioEntry interface, lazy /api/portfolio fetch, phase/continuity/gaps badges on project cards, skeleton loading state, and urgency/name sort toggle**

## What Happened

Seven targeted changes to src/App.tsx: (1) PortfolioEntry interface after ProjectPlan; (2) three new state vars (portfolioData Map, portfolioLoading, projectSortMode); (3) useEffect on [projects] that fetches /api/portfolio and populates the Map — silent catch for graceful degradation; (4) filteredProjects useMemo updated to sort by urgency score descending or alphabetically by name; (5) sort toggle pill button above the grid; (6) card badge area augmented with skeleton pill while loading, then phase + continuity badges from portfolio data; (7) gaps indicator line at card bottom showing e.g. '2 gaps · 13 unresolved'.

## Verification

npx tsc --noEmit exited 0 with no output.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit && echo TS_OK` | 0 | ✅ pass | 8000ms |


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
