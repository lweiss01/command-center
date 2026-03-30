---
id: T01
parent: S01
milestone: M003
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["Machine-tool applies return 400 with an explanatory message rather than silently succeeding or redirecting — keeps the boundary explicit", "Already-present components return ok:true with action:already-present for idempotency"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "PowerShell/curl: POST to /api/projects/2/bootstrap/apply with componentId=gsd-dir successfully created .gsd/ directory in filetrx repo. POST with componentId=gsd-tool correctly returned {ok:false, error: 'Machine-level tool installation cannot be applied automatically.'} with 400 status."
completed_at: 2026-03-30T01:19:36.262Z
blocker_discovered: false
---

# T01: Implemented POST /api/projects/:id/bootstrap/apply endpoint handling all repo-local and machine-tool cases

> Implemented POST /api/projects/:id/bootstrap/apply endpoint handling all repo-local and machine-tool cases

## What Happened
---
id: T01
parent: S01
milestone: M003
key_files:
  - server.js
key_decisions:
  - Machine-tool applies return 400 with an explanatory message rather than silently succeeding or redirecting — keeps the boundary explicit
  - Already-present components return ok:true with action:already-present for idempotency
duration: ""
verification_result: passed
completed_at: 2026-03-30T01:19:36.262Z
blocker_discovered: false
---

# T01: Implemented POST /api/projects/:id/bootstrap/apply endpoint handling all repo-local and machine-tool cases

**Implemented POST /api/projects/:id/bootstrap/apply endpoint handling all repo-local and machine-tool cases**

## What Happened

Added the bootstrap apply endpoint to server.js. The endpoint accepts { componentId } in the body, resolves the component from computeReadiness, rejects machine-tool components with 400, handles already-present as idempotent OK, then dispatches to the appropriate action: gsd-dir creates .gsd/, holistic-dir runs holistic init, and the five gsd-doc-* components write stub files. BOOTSTRAP_STUBS provides the file content generators. computeBootstrapPlan was also updated to include componentId and instructions on each step so the UI can send the right componentId and display install commands for machine-level steps.

## Verification

PowerShell/curl: POST to /api/projects/2/bootstrap/apply with componentId=gsd-dir successfully created .gsd/ directory in filetrx repo. POST with componentId=gsd-tool correctly returned {ok:false, error: 'Machine-level tool installation cannot be applied automatically.'} with 400 status.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `curl -s -X POST http://localhost:3001/api/projects/2/bootstrap/apply -H 'Content-Type: application/json' -d '{"componentId":"gsd-dir"}'` | 0 | ✅ pass | 80ms |
| 2 | `curl -s -X POST http://localhost:3001/api/projects/1/bootstrap/apply -H 'Content-Type: application/json' -d '{"componentId":"gsd-tool"}'` | 0 | ✅ pass — 400 with expected error | 40ms |


## Deviations

computeBootstrapPlan was updated in the same commit to include componentId/instructions on steps — this was called out in the T02 plan as a prerequisite but done as part of T01 implementation.

## Known Issues

None.

## Files Created/Modified

- `server.js`


## Deviations
computeBootstrapPlan was updated in the same commit to include componentId/instructions on steps — this was called out in the T02 plan as a prerequisite but done as part of T01 implementation.

## Known Issues
None.
