# S02: Add project by path

**Goal:** Enable the disabled 'New' button in the UI. Accept a directory path, validate it, upsert it as a project, run auto-import, and return the project.
**Demo:** After this: After this: user can type a directory path into the 'New' input and add a project without running a full workspace scan.

## Tasks
- [x] **T01: Added POST /api/projects/add endpoint with path validation and auto-import** — Add POST /api/projects/add endpoint:
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
  - Estimate: 25m
  - Files: server.js
  - Verify: POST with valid path returns ok:true with project and autoImport. POST with non-existent path returns 400 with error. POST with a path containing spaces works.
- [x] **T02: Added inline add-project form to sidebar** — 1. Update the 'New' button in App.tsx:
   - Add state: addProjectPath (string), addProjectError (string|null), addProjectInFlight (bool), showAddProject (bool)
   - 'New' button toggles showAddProject
   - When showAddProject=true, show a small inline form below the 'New' button:
     • text input placeholder 'Directory path…' bound to addProjectPath
     • 'Add' button (disabled while inFlight or path empty)
     • 'Cancel' button that hides the form and clears state
   - On submit: POST /api/projects/add with { path: addProjectPath }
     On success: close form, refresh projects list, select the new project
     On error: show addProjectError inline below the input

2. Remove the disabled prop from the existing New button (it was disabled pending this implementation)

3. Keep the form compact — it should fit inside the sidebar without scrolling
  - Estimate: 35m
  - Files: src/App.tsx
  - Verify: Build passes. New button shows input form. Valid path adds project and selects it. Invalid path shows error inline. Cancel hides form.
- [x] **T03: Browser verification passed for add-project UI** — Start dev server + backend. Click New button. Enter a valid path (e.g. C:\Users\lweis\Documents\holistic). Click Add. Assert: holistic appears in the project list and is selected. Enter an invalid path. Assert: error message shown. No console errors.
  - Estimate: 15m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: add form visible after New click, project added on valid path, error shown on invalid path, no console errors.
