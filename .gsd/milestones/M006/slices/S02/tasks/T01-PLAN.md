---
estimated_steps: 11
estimated_files: 1
skills_used: []
---

# T01: Add POST /api/projects/add endpoint

Add POST /api/projects/add endpoint:
1. Accept { path: string } in request body
2. Validate:
   - path is provided and is a string
   - fs.existsSync(resolvedPath) — directory must exist
   - isProjectCandidate(resolvedPath) OR has a .git — must be a recognizable project
   - Return 400 with { ok: false, error: '<reason>' } on any validation failure
3. Call upsertProjectWithArtifacts(resolvedPath)
4. Call autoImportForProject(result.projectId)
5. Return { ok: true, project: serializeProjectRow(getProjectById.get(result.projectId)), autoImport: { imported, skipped, warnings } }
6. Log: [project/add] path=X projectId=Y imported=[...]

## Inputs

- `server.js — upsertProjectWithArtifacts, autoImportForProject, isProjectCandidate, serializeProjectRow`

## Expected Output

- `POST /api/projects/add endpoint in server.js`

## Verification

POST with valid path returns ok:true with project and autoImport. POST with non-existent path returns 400 with error. POST with a path containing spaces works.
