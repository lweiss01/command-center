---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Ship canonical planning schema and project plan snapshot endpoint

Retroactive task for shipped canonical planning schema: CREATE TABLE statements for projects, source_artifacts, scan_runs, import_runs, milestones, slices, planning_tasks, requirements, decisions, evidence_links, plus GET /api/projects/:id/plan snapshot endpoint.

## Inputs

- `S01 project rows`
- `S02 source_artifacts rows`

## Expected Output

- `server.js — all canonical schema tables and plan snapshot endpoint`

## Verification

GET /api/projects/:id/plan returns milestones, requirements, decisions, importRuns, workflowState, continuity, nextAction without error.
