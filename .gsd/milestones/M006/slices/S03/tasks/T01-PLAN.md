---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T01: Add Import All endpoint

Add a new endpoint `POST /api/projects/:id/import-all` to `server.js`:
1. Look up the project.
2. Check for existence of `gsd_project`, `gsd_requirements`, and `gsd_decisions` artifacts.
3. For each one that exists, run the corresponding import function (`importGsdProjectMilestones`, `importGsdRequirements`, `importGsdDecisions`).
4. Catch errors for individual imports so one failure doesn't block the others.
5. Return a summary of what was imported.

## Inputs

- `server.js - existing import functions`

## Expected Output

- ``POST /api/projects/:id/import-all` endpoint in `server.js``

## Verification

Call the endpoint via `node -e` or `curl` on a project with docs and verify it runs the imports.
