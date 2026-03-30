---
id: S04
parent: M002
milestone: M002
provides:
  - openLoops field on /api/projects/:id/plan response with nextMilestone, blockedMilestones, unresolvedRequirements, deferredItems, revisableDecisions, and summary
  - Open Loops cockpit panel rendering all five sub-sections with live data
  - TypeScript interfaces OpenLoopItem, OpenLoopsSummary, OpenLoops in App.tsx
requires:
  - slice: S01
    provides: plan route structure and interpretation function pattern
  - slice: S02
    provides: continuity data available in plan route response
  - slice: S03
    provides: readiness data available in plan route response
affects:
  - S05 — cross-repo prioritization can consume openLoops.summary counts for urgency scoring
  - S06 — trust surfaces will distinguish imported vs interpreted in the Open Loops panel
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - computeOpenLoops follows the same pure-function pattern as computeReadiness/computeContinuity/computeNextAction — pure, takes {milestones, requirements, decisions}, wired in plan route
  - Open Loops panel placed after Next Action and before Import Controls, using the same projectPlan?.openLoops guard as the readiness panel
  - Unresolved Requirements capped at 5 with '+ N more' overflow line
  - revisableDecisions filter uses .toLowerCase().startsWith('yes') on freeform text field
patterns_established:
  - computeOpenLoops pure-function interpretation pattern — sixth interpretation signal added without touching route structure, only adding one function and one key to res.json
observability_surfaces:
  - Open Loops panel in cockpit shows live counts: unresolvedCount, deferredCount, blockedCount, pendingMilestoneCount
  - API response includes openLoops.summary with all four counts for programmatic inspection
drill_down_paths:
  - .gsd/milestones/M002/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S04/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T16:50:51.361Z
blocker_discovered: false
---

# S04: Repo drill-down for open loops

**Added computeOpenLoops() to the backend and rendered the Open Loops panel in the cockpit — showing next milestone, blocked milestones, unresolved requirements (capped at 5 with overflow), deferred items, and revisable decisions with live data.**

## What Happened

S04 was a two-task slice. T01 added `computeOpenLoops({ milestones, requirements, decisions })` to server.js, following the same pure-function pattern established by the three prior interpretation functions (computeWorkflowState, computeContinuity, computeReadiness). The function derives six output fields: nextMilestone (first non-done milestone), blockedMilestones, unresolvedRequirements (active + not validated, first 5 with overflow), deferredItems, revisableDecisions (freeform 'yes'-prefix filter), and a summary object with four counts. It was wired into the plan route and confirmed working against the live server: unresolvedCount=13, pendingMilestoneCount=5, blockedCount=0, deferredCount=3.

T02 added the TypeScript interfaces (OpenLoopItem, OpenLoopsSummary, OpenLoops), extended ProjectPlan, and rendered the Open Loops panel in App.tsx. The panel was placed after the Next Action section and before Import Controls, using the same guard pattern as the readiness and continuity panels. It renders all five sub-sections with live data. Unresolved Requirements is capped at 5 items with a '+ N more' line when there are more. TypeScript compiled clean (exit 0) and 5/5 browser assertions confirmed all panel content visible with correct live counts.

## Verification

TypeScript: `npx tsc --noEmit` exit 0. API: inline Node fetch confirmed openLoops shape with all four summary fields (unresolvedCount=13, pendingMilestoneCount=5, blockedCount=0, deferredCount=3) and all assertions passing. Browser: 5/5 text assertions pass — 'Open Loops' heading, sub-label 'What's next, blocked, and still unresolved.', Next Milestone, Unresolved Requirements, Revisable Decisions all visible with live data.

## Requirements Advanced

- R006 — Cockpit now shows what's next (nextMilestone), what's unresolved (unresolvedRequirements), and what's deferred — directly fulfilling the primary-user-loop requirement for drill-down beyond imported entities
- R011 — Discussion and research uncertainty surfaced via revisableDecisions and deferredItems sub-sections, keeping 'what's still up in the air' visible in the repo view
- R001 — Open Loops adds a fifth interpretation panel to the cockpit, advancing the explainable-state goal with actionable open questions rather than just raw imported entities

## Requirements Validated

- R006 — Open Loops panel live in cockpit with all five sub-sections populated from real imported data (13 unresolved, 3 deferred, next milestone shown, revisable decisions listed). TypeScript clean, API verified, browser 5/5 pass.

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

- `server.js` — Added computeOpenLoops() pure function and wired openLoops into plan route res.json response
- `src/App.tsx` — Added OpenLoopItem/OpenLoopsSummary/OpenLoops TypeScript interfaces, extended ProjectPlan, rendered Open Loops panel with all five sub-sections
