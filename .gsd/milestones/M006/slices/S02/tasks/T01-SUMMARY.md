---
id: T01
parent: S02
milestone: M006
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["Endpoint calls upsertProjectWithArtifacts and then autoImportForProject so the newly added project is immediately fully populated if it has docs."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Endpoint returns 400 for non-existent path. In UI, valid path successfully adds project."
completed_at: 2026-03-31T19:29:07.589Z
blocker_discovered: false
---

# T01: Added POST /api/projects/add endpoint with path validation and auto-import

> Added POST /api/projects/add endpoint with path validation and auto-import

## What Happened
---
id: T01
parent: S02
milestone: M006
key_files:
  - server.js
key_decisions:
  - Endpoint calls upsertProjectWithArtifacts and then autoImportForProject so the newly added project is immediately fully populated if it has docs.
duration: ""
verification_result: passed
completed_at: 2026-03-31T19:29:07.595Z
blocker_discovered: false
---

# T01: Added POST /api/projects/add endpoint with path validation and auto-import

**Added POST /api/projects/add endpoint with path validation and auto-import**

## What Happened

Added POST /api/projects/add endpoint to server.js. It validates that the path exists, is a directory, and is a project candidate (or has a .git dir). If valid, it upserts the project, runs auto-import, and returns the serialized project along with the auto-import summary. Errors return 400 or 500 with a clear message.

## Verification

Endpoint returns 400 for non-existent path. In UI, valid path successfully adds project.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `API manual tests and UI testing` | 0 | ✅ pass | 500ms |


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
