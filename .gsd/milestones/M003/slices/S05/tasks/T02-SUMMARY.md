---
id: T02
parent: S05
milestone: M003
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["driftCount in plan response computed from cached readiness (no extra probe) — full drift detail with per-entry probe lives in the dedicated /bootstrap/audit endpoint", "audit endpoint queries all rows for project ordered by applied_at DESC, re-probes readiness once, then derives drift per entry"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "GET /bootstrap/audit returned {entries:[], driftCount:0} before any apply. After apply + removal of created dir, returned entries with drift:true and driftCount:1."
completed_at: 2026-03-31T00:52:34.302Z
blocker_discovered: false
---

# T02: Added /bootstrap/audit endpoint with drift detection and driftCount in plan response

> Added /bootstrap/audit endpoint with drift detection and driftCount in plan response

## What Happened
---
id: T02
parent: S05
milestone: M003
key_files:
  - server.js
key_decisions:
  - driftCount in plan response computed from cached readiness (no extra probe) — full drift detail with per-entry probe lives in the dedicated /bootstrap/audit endpoint
  - audit endpoint queries all rows for project ordered by applied_at DESC, re-probes readiness once, then derives drift per entry
duration: ""
verification_result: passed
completed_at: 2026-03-31T00:52:34.302Z
blocker_discovered: false
---

# T02: Added /bootstrap/audit endpoint with drift detection and driftCount in plan response

**Added /bootstrap/audit endpoint with drift detection and driftCount in plan response**

## What Happened

Added GET /api/projects/:id/bootstrap/audit that queries bootstrap_actions, re-runs computeReadiness, builds a componentStatusMap, and returns entries with currentStatus and drift:true where the component is now missing. Added lightweight driftCount to the plan response by querying distinct applied component IDs and checking against the already-computed readiness, avoiding a second full readiness probe.

## Verification

GET /bootstrap/audit returned {entries:[], driftCount:0} before any apply. After apply + removal of created dir, returned entries with drift:true and driftCount:1.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `curl http://localhost:3001/api/projects/6/bootstrap/audit (before apply)` | 0 | ✅ pass — empty entries | 70ms |
| 2 | `curl http://localhost:3001/api/projects/6/bootstrap/audit (after apply+removal)` | 0 | ✅ pass — drift:true, driftCount:1 | 80ms |


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
