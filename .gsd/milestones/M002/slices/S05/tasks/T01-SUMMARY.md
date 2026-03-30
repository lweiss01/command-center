---
id: T01
parent: S05
milestone: M002
provides: []
requires: []
affects: []
key_files: ["server.js", ".gsd/milestones/M002/slices/S05/tasks/T01-SUMMARY.md"]
key_decisions: ["toolOverrides pattern on computeReadiness avoids O(N) execFileSync calls in portfolio route", "probeToolStatus inlined at route level per plan guidance — keeps inner toolStatus helper scoped to computeReadiness", "projectForCompute object reconstructed with root_path snake_case key since serializeProjectRow maps to rootPath camelCase"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the plan-specified verification: curl -s http://localhost:3001/api/portfolio piped into node script that checks count, prints per-project urgency/phase/continuity, and verifies descending sort. Output: Count: 7, Sorted desc: true, exit 0, printed OK."
completed_at: 2026-03-28T17:01:06.405Z
blocker_discovered: false
---

# T01: Added computeUrgencyScore pure function and GET /api/portfolio endpoint to server.js; endpoint returns all projects sorted by urgency score descending with phase, continuity, and readiness signals per entry

> Added computeUrgencyScore pure function and GET /api/portfolio endpoint to server.js; endpoint returns all projects sorted by urgency score descending with phase, continuity, and readiness signals per entry

## What Happened
---
id: T01
parent: S05
milestone: M002
key_files:
  - server.js
  - .gsd/milestones/M002/slices/S05/tasks/T01-SUMMARY.md
key_decisions:
  - toolOverrides pattern on computeReadiness avoids O(N) execFileSync calls in portfolio route
  - probeToolStatus inlined at route level per plan guidance — keeps inner toolStatus helper scoped to computeReadiness
  - projectForCompute object reconstructed with root_path snake_case key since serializeProjectRow maps to rootPath camelCase
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:01:06.409Z
blocker_discovered: false
---

# T01: Added computeUrgencyScore pure function and GET /api/portfolio endpoint to server.js; endpoint returns all projects sorted by urgency score descending with phase, continuity, and readiness signals per entry

**Added computeUrgencyScore pure function and GET /api/portfolio endpoint to server.js; endpoint returns all projects sorted by urgency score descending with phase, continuity, and readiness signals per entry**

## What Happened

Three targeted changes to server.js: (1) computeReadiness got an optional toolOverrides param so the portfolio route can probe holistic/gsd tool availability once and reuse results across all N projects instead of calling execFileSync N times each; (2) computeUrgencyScore pure function added using additive fixed increments (+0.40 fresh continuity, +0.25 unresolved requirements, +0.20 stalled/no-data with non-missing continuity, +0.15 readiness gaps, capped at 1.0); (3) GET /api/portfolio route added after the plan route — probes tools once, iterates all projects, runs full interpretation pipeline per project, assembles PortfolioEntry objects, sorts descending by urgencyScore, returns JSON array.

## Verification

Ran the plan-specified verification: curl -s http://localhost:3001/api/portfolio piped into node script that checks count, prints per-project urgency/phase/continuity, and verifies descending sort. Output: Count: 7, Sorted desc: true, exit 0, printed OK.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `curl -s http://localhost:3001/api/portfolio > check.json && node -e "...sort check..." && echo OK` | 0 | ✅ pass | 4000ms |


## Deviations

Minor: plan step 3c spells the function computNextAction (missing 'e') — used the correct name computeNextAction as it exists in server.js. Not a functional deviation.

## Known Issues

None.

## Files Created/Modified

- `server.js`
- `.gsd/milestones/M002/slices/S05/tasks/T01-SUMMARY.md`


## Deviations
Minor: plan step 3c spells the function computNextAction (missing 'e') — used the correct name computeNextAction as it exists in server.js. Not a functional deviation.

## Known Issues
None.
