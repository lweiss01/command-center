---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T02: Wire auto-import into scanWorkspaceRoot

In scanWorkspaceRoot, after upsertProjectWithArtifacts call:
1. Call autoImportForProject(result.projectId)
2. Accumulate importedCount and skippedCount across all projects
3. Log: [scan/auto-import] project=X imported=[...] skipped=[...]
4. Add autoImportSummary: { totalImported, totalSkipped } to the scan run summary and return value

Scan should still complete even if auto-import fails for one project.

## Inputs

- `server.js — scanWorkspaceRoot, autoImportForProject from T01`

## Expected Output

- `scanWorkspaceRoot updated to call autoImportForProject`

## Verification

POST /api/scan on command-center workspace: response includes autoImportSummary. DB: imported entities exist for projects that had docs. Time the scan — confirm < 10s.
