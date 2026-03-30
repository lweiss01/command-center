---
id: T01
parent: S04
milestone: M002
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["computeOpenLoops follows the same pure-function pattern as computeReadiness/computeContinuity/computeNextAction — takes {milestones, requirements, decisions}, returns derived shape, called in plan route"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Ran the task-plan verification command against the live server on :3001. Output: OK {"unresolvedCount":13,"pendingMilestoneCount":5,"blockedCount":0,"deferredCount":3}. All four assertions (nextMilestone not null, unresolvedCount >= 1, deferredItems.length >= 1, revisableDecisions.length >= 1) passed with exit code 0."
completed_at: 2026-03-28T16:46:04.119Z
blocker_discovered: false
---

# T01: Added computeOpenLoops() to server.js and wired openLoops into the plan route API response

> Added computeOpenLoops() to server.js and wired openLoops into the plan route API response

## What Happened
---
id: T01
parent: S04
milestone: M002
key_files:
  - server.js
key_decisions:
  - computeOpenLoops follows the same pure-function pattern as computeReadiness/computeContinuity/computeNextAction — takes {milestones, requirements, decisions}, returns derived shape, called in plan route
duration: ""
verification_result: passed
completed_at: 2026-03-28T16:46:04.122Z
blocker_discovered: false
---

# T01: Added computeOpenLoops() to server.js and wired openLoops into the plan route API response

**Added computeOpenLoops() to server.js and wired openLoops into the plan route API response**

## What Happened

Inserted computeOpenLoops({ milestones, requirements, decisions }) after computeNextAction in server.js. The function derives nextMilestone, blockedMilestones, unresolvedRequirements, deferredItems, revisableDecisions, and a summary object. Called it in the plan route and added openLoops to res.json(). Had to kill a stale server instance before the updated code took effect. Verification confirmed all four assertions pass: unresolvedCount=13, pendingMilestoneCount=5, deferredItems=3, revisableDecisions=4.

## Verification

Ran the task-plan verification command against the live server on :3001. Output: OK {"unresolvedCount":13,"pendingMilestoneCount":5,"blockedCount":0,"deferredCount":3}. All four assertions (nextMilestone not null, unresolvedCount >= 1, deferredItems.length >= 1, revisableDecisions.length >= 1) passed with exit code 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --input-type=module -e "...verify openLoops shape assertions..."` | 0 | ✅ pass | 900ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `server.js`


## Deviations
None.

## Known Issues
None.
