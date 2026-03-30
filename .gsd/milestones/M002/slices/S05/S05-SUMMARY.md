---
id: S05
parent: M002
milestone: M002
provides:
  - GET /api/portfolio endpoint returning all projects sorted by urgency with full signal payload
  - computeUrgencyScore pure function
  - PortfolioEntry TypeScript interface
  - Card grid with portfolio signal badges and urgency/name sort toggle
requires:
  - slice: S02
    provides: computeContinuity with checkpointHygiene and freshness — consumed by per-project pipeline in portfolio route
  - slice: S03
    provides: computeReadiness with toolOverrides extension point — consumed by portfolio route with single probe
  - slice: S04
    provides: computeOpenLoops with unresolvedCount/pendingMilestoneCount/blockedCount — consumed as urgency inputs
affects:
  - S06
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - toolOverrides pattern on computeReadiness prevents O(N) execFileSync calls in the portfolio route (D012)
  - computeUrgencyScore uses additive fixed increments consistent with the explainable scoring philosophy from S01/D006 (D013)
  - probeToolStatus inlined at portfolio route level — inner toolStatus helper stays scoped to computeReadiness
  - projectForCompute reconstructed with root_path snake_case key to match what interpretation functions expect
  - IIFE pattern used for per-card portfolio badge rendering to keep inline logic readable
  - portfolioLoading skeleton only shown when loading AND entry not yet in map to prevent flicker
patterns_established:
  - Portfolio interpretation pattern: probe tools once at handler entry, pass via toolOverrides, iterate projects with full pipeline, sort by urgencyScore descending
  - Card augmentation pattern: portfolioData Map keyed by project.id, badge injection via IIFE in JSX, skeleton pill while loading
  - Pure interpretation function pattern (computeUrgencyScore) follows same additive fixed-increment philosophy as all other M002 interpretation functions
observability_surfaces:
  - GET /api/portfolio returns full urgencyScore, phase, continuity, readiness, unresolved counts, and gaps per project — consumable by any future dashboard or CLI
  - portfolioLoading state surfaces loading status in the UI — no silent spinner
drill_down_paths:
  - C:/Users/lweis/Documents/command-center/.gsd/milestones/M002/slices/S05/tasks/T01-SUMMARY.md
  - C:/Users/lweis/Documents/command-center/.gsd/milestones/M002/slices/S05/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:07:20.013Z
blocker_discovered: false
---

# S05: Cross-repo prioritization view

**Added GET /api/portfolio endpoint (computeUrgencyScore + full per-project interpretation pipeline) and upgraded the App.tsx card grid with portfolio signal badges, skeleton loading, and urgency/name sort toggle.**

## What Happened

S05 delivered the portfolio layer in two tasks. T01 extended server.js with two targeted additions: the optional toolOverrides parameter on computeReadiness (preventing O(N) subprocess calls per portfolio fetch), and the computeUrgencyScore pure function using additive fixed increments (+0.40 fresh continuity, +0.25 unresolved requirements, +0.20 stalled/no-data non-missing continuity, +0.15 readiness gaps, capped at 1.0). The GET /api/portfolio route probes holistic/gsd tool availability once at handler entry, iterates all registered projects running the full five-function interpretation pipeline per project (computeContinuity, computeReadiness with toolOverrides, computeWorkflowState, computeNextAction, computeOpenLoops), assembles PortfolioEntry objects, sorts descending by urgencyScore, and returns a JSON array. T02 updated src/App.tsx with the PortfolioEntry TypeScript interface, three new state vars (portfolioData Map, portfolioLoading, projectSortMode), a useEffect that lazily fetches /api/portfolio after projects load and populates the Map, an updated filteredProjects useMemo that sorts by urgency score or name, a sort toggle pill button above the grid, portfolio signal badges (phase + continuity) and skeleton pills on each project card while loading, and a gap indicator line per card showing gaps count and unresolved count. TypeScript compiled clean. Live verification confirmed: 7 projects returned, sorted descending, with correct urgency scores, phases, continuity statuses, readiness levels, and unresolved counts per entry.

## Verification

Two verification passes: (1) T01 — curl to /api/portfolio piped into a node script that checked count (7), verified descending sort, and printed phase/continuity/urgency per project — exit 0, OK printed. (2) T02 — npx tsc --noEmit exited 0, no errors. Slice-level re-run of both verifications confirmed identical results after T02 landed.

## Requirements Advanced

- R002 — Delivered the cross-repo prioritization view: portfolio endpoint ranks all repos by urgency with phase, continuity, readiness, and unresolved signals; card grid shows these signals per card with sort toggle

## Requirements Validated

- R002 — Live /api/portfolio returns 7 projects sorted descending by urgencyScore with correct phase, continuity, readiness, unresolvedCount, and gaps per entry; TypeScript compiles clean; UI renders badges and sort toggle

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Minor: plan step 3c references `computNextAction` (typo) — implementation used the correct function name `computeNextAction` as it exists in server.js.

## Known Limitations

Portfolio fetch fires lazily after projects load — on slow machines there is a brief window where cards render without badges before the portfolio response arrives. The skeleton pill mitigates visual shift. No caching between navigations; each App mount refetches /api/portfolio.

## Follow-ups

S06 (trust and anti-hidden-state surfaces) should visually distinguish imported facts from interpreted conclusions on the portfolio card badges to keep the explainability contract intact.

## Files Created/Modified

- `server.js` — Added toolOverrides param to computeReadiness, computeUrgencyScore pure function, and GET /api/portfolio route
- `src/App.tsx` — Added PortfolioEntry interface, portfolioData/portfolioLoading/projectSortMode state, portfolio fetch effect, sort toggle, card signal badges, skeleton pills, and gaps indicator
- `.gsd/DECISIONS.md` — Appended D012 (toolOverrides pattern) and D013 (computeUrgencyScore increments)
- `.gsd/KNOWLEDGE.md` — Appended S05 section: toolOverrides pattern, snake_case root_path mismatch, filteredProjects spread-before-sort
