# S01: Auto-import on scan

**Goal:** After a scan detects a project with GSD planning docs, automatically run the corresponding imports — but only if no import has run within the last 24 hours for that artifact type.
**Demo:** After this: After this: running a scan automatically imports planning data for any discovered project that has GSD docs — no manual import buttons required for fresh projects.

## Tasks
- [x] **T01: autoImportForProject written and integrated into scan \u2014 skips fresh imports, runs stale ones** — Write autoImportForProject(projectId) function:

1. Look up all latest import runs for this project (one per strategy)
2. Check each artifact type:
   - gsd_project artifact present AND (no import run OR last run > 24h ago) → call importGsdProjectMilestones(projectId)
   - gsd_requirements artifact present AND stale → call importGsdRequirements(projectId)
   - gsd_decisions artifact present AND stale → call importGsdDecisions(projectId)
3. Return { imported: string[], skipped: string[], warnings: string[] }

Stale = no completed import run, or last completedAt > 24h ago.

Note: use try/catch per import so one failure does not block others.
  - Estimate: 25m
  - Files: server.js
  - Verify: node inline test: call autoImportForProject on a project with docs — imported array has the right artifact types. Call again immediately — all entries move to skipped.
- [x] **T02: scanWorkspaceRoot calls autoImportForProject per project and reports totals** — In scanWorkspaceRoot, after upsertProjectWithArtifacts call:
1. Call autoImportForProject(result.projectId)
2. Accumulate importedCount and skippedCount across all projects
3. Log: [scan/auto-import] project=X imported=[...] skipped=[...]
4. Add autoImportSummary: { totalImported, totalSkipped } to the scan run summary and return value

Scan should still complete even if auto-import fails for one project.
  - Estimate: 20m
  - Files: server.js
  - Verify: POST /api/scan on command-center workspace: response includes autoImportSummary. DB: imported entities exist for projects that had docs. Time the scan — confirm < 10s.
- [x] **T03: Auto-import verified: 574ms scan, 13 imports, idempotent on second run** — 1. POST /api/scan with the command-center workspace root
2. Time the full scan — assert < 10s
3. Check DB: SELECT COUNT(*) FROM milestones WHERE project_id = (id of a project that has PROJECT.md) — assert > 0
4. POST /api/scan again immediately — assert all skipped (imported from first run < 24h ago)
5. No regressions: GET /api/projects still returns all projects
  - Estimate: 15m
  - Files: server.js
  - Verify: Scan timing < 10s. DB confirmed entities imported. Second scan shows all skipped. GET /api/projects unchanged.
