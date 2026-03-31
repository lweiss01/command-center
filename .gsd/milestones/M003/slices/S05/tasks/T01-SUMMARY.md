---
id: T01
parent: S05
milestone: M003
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["stage is always 'repo-local' for auto-applied steps — machine-tool steps are rejected before reaching this code path"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Confirmed by running POST apply and querying bootstrap/audit — entry appeared with correct fields."
completed_at: 2026-03-31T00:52:22.319Z
blocker_discovered: false
---

# T01: Added bootstrap_actions audit table and INSERT on every successful apply

> Added bootstrap_actions audit table and INSERT on every successful apply

## What Happened
---
id: T01
parent: S05
milestone: M003
key_files:
  - server.js
key_decisions:
  - stage is always 'repo-local' for auto-applied steps — machine-tool steps are rejected before reaching this code path
duration: ""
verification_result: passed
completed_at: 2026-03-31T00:52:22.320Z
blocker_discovered: false
---

# T01: Added bootstrap_actions audit table and INSERT on every successful apply

**Added bootstrap_actions audit table and INSERT on every successful apply**

## What Happened

Added CREATE TABLE IF NOT EXISTS bootstrap_actions with columns for project_id, component_id, action, stage, path, template_id, applied_at, source_gap. Added a matching index on project_id. In the POST /bootstrap/apply handler, after the file/dir operation succeeds and before res.json, inserts a row using db.prepare().run() with all fields. source_gap comes from component.label (available in the handler from the readiness probe). Logs [bootstrap/audit] recorded on success.

## Verification

Confirmed by running POST apply and querying bootstrap/audit — entry appeared with correct fields.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `curl http://localhost:3001/api/projects/6/bootstrap/audit` | 0 | ✅ pass — {entries:[{...}], driftCount:0} | 80ms |


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
