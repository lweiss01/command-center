---
id: S03
parent: M001
milestone: M001
provides:
  - Canonical tables and plan snapshot endpoint for S04/S05/S06 import routes
requires:
  - slice: S02
    provides: source_artifacts rows
affects:
  - S04
  - S05
  - S06
key_files:
  - server.js
key_decisions:
  - Single /api/projects/:id/plan endpoint assembles all imported entities plus interpreted state — keeps frontend from forking its own judgments.
patterns_established:
  - Single plan snapshot endpoint pattern — all cockpit data flows through /api/projects/:id/plan
observability_surfaces:
  - import_runs table with status and warnings_json
  - evidence_links provenance table
  - /api/projects/:id/plan snapshot endpoint
drill_down_paths:
  - .gsd/milestones/M001/slices/S03/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:33:52.175Z
blocker_discovered: false
---

# S03: Canonical planning schema

**Canonical planning schema and project plan snapshot endpoint establish the internal model all import slices build on.**

## What Happened

Schema created with WAL mode. Canonical tables: projects, source_artifacts, scan_runs, import_runs, milestones, slices, planning_tasks, requirements, decisions, evidence_links. Legacy migration handled. /api/projects/:id/plan returns the full snapshot. computeContinuity/workflowState/nextAction provide conservative interpreted signals. Verified: endpoint returns 200 with complete payload.

## Verification

GET /api/projects/1/plan returns 200 with full snapshot. M001-VALIDATION.md: PASS.

## Requirements Advanced

- R008 — Canonical schema keeps internal state subordinate to repo docs via import_runs and evidence_links provenance.
- R007 — Schema stores imported entities from repo-local docs as the canonical internal model.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. Retroactive completion.

## Known Limitations

None beyond M001 scope.

## Follow-ups

None.

## Files Created/Modified

- `server.js` — All canonical schema tables, migrateLegacyProjectsTable, /api/projects/:id/plan snapshot endpoint, computeContinuity, computeWorkflowState, computeNextAction
