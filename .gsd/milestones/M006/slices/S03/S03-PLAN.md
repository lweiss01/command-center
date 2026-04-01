# S03: First-run onboarding card

**Goal:** Detect the 'has docs, no imports yet' state. Show a first-run onboarding card in the project detail view with a single 'Import All' button that runs all three imports sequentially and refreshes the plan.
**Demo:** After this: After this: opening a project that has planning docs but zero imports shows a prominent 'Import All' card instead of empty panels — one click to populate everything.

## Tasks
- [x] **T01: Added POST /api/projects/:id/import-all endpoint to sequentially run all available imports.** — Add a new endpoint `POST /api/projects/:id/import-all` to `server.js`:
1. Look up the project.
2. Check for existence of `gsd_project`, `gsd_requirements`, and `gsd_decisions` artifacts.
3. For each one that exists, run the corresponding import function (`importGsdProjectMilestones`, `importGsdRequirements`, `importGsdDecisions`).
4. Catch errors for individual imports so one failure doesn't block the others.
5. Return a summary of what was imported.
  - Estimate: 20m
  - Files: server.js
  - Verify: Call the endpoint via `node -e` or `curl` on a project with docs and verify it runs the imports.
- [x] **T02: Added first-run onboarding card to UI for projects with docs but no imports** — Update `App.tsx` to show the onboarding card:
1. Determine if the onboarding card should be shown: `projectPlan.milestones.length === 0 && projectPlan.requirements.length === 0 && projectPlan.decisions.length === 0` AND the project has at least one of `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, or `.gsd/DECISIONS.md` (check `projectPlan.readiness.components` for `gsd-doc-project` etc. being `present`).
2. If true, render a prominent card at the top of the detail view (above or replacing Workflow State for this edge case).
3. Card contains:
   - "Planning Docs Detected"
   - "This repository contains GSD planning documents but they haven't been imported yet."
   - "Import All" button.
4. Add a `handleImportAll` function that calls `POST /api/projects/:id/import-all`, sets a loading state, and then calls `loadProjectPlan`.
  - Estimate: 40m
  - Files: src/App.tsx
  - Verify: Build clean. In browser, select a project with docs but no imports (or manually clear imports from DB for a test project) and see the card. Click "Import All" and see data populate.
- [x] **T03: End-to-end browser verification of first-run onboarding passed** — End-to-end browser verification:
1. Start dev server + backend.
2. Use sqlite to delete import runs and milestone/req/decision data for `holistic` project to simulate a fresh state.
3. Select `holistic` in UI.
4. Assert onboarding card is visible.
5. Click "Import All".
6. Assert panels populate and card disappears.
7. Restore state or just let the import keep it restored.
8. No console errors.
  - Estimate: 20m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert confirms card appears, button is clickable, and state updates.
