---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T01: Write autoImportForProject function

Write autoImportForProject(projectId) function:

1. Look up all latest import runs for this project (one per strategy)
2. Check each artifact type:
   - gsd_project artifact present AND (no import run OR last run > 24h ago) → call importGsdProjectMilestones(projectId)
   - gsd_requirements artifact present AND stale → call importGsdRequirements(projectId)
   - gsd_decisions artifact present AND stale → call importGsdDecisions(projectId)
3. Return { imported: string[], skipped: string[], warnings: string[] }

Stale = no completed import run, or last completedAt > 24h ago.

Note: use try/catch per import so one failure does not block others.

## Inputs

- `server.js — importGsdProjectMilestones, importGsdRequirements, importGsdDecisions, listImportRunsByProjectId, listArtifactsByProjectId`

## Expected Output

- `autoImportForProject function in server.js`

## Verification

node inline test: call autoImportForProject on a project with docs — imported array has the right artifact types. Call again immediately — all entries move to skipped.
