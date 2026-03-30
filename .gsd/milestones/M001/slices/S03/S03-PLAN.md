# S03: Canonical planning schema

**Goal:** Create the canonical local schema and persistence layer that receives discovered artifacts and imported planning entities without replacing repo-local truth.
**Demo:** After this: After this: the backend persists projects, artifacts, import runs, milestones, slices, tasks, requirements, decisions, and evidence links in a normalized model.

## Tasks
- [x] **T01: Canonical planning schema and project plan snapshot endpoint shipped and verified live.** — Retroactive task for shipped canonical planning schema: CREATE TABLE statements for projects, source_artifacts, scan_runs, import_runs, milestones, slices, planning_tasks, requirements, decisions, evidence_links, plus GET /api/projects/:id/plan snapshot endpoint.
  - Estimate: shipped
  - Files: server.js
  - Verify: GET /api/projects/:id/plan returns milestones, requirements, decisions, importRuns, workflowState, continuity, nextAction without error.
