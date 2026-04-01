---
estimated_steps: 8
estimated_files: 1
skills_used: []
---

# T02: Add First-run onboarding card to UI

Update `App.tsx` to show the onboarding card:
1. Determine if the onboarding card should be shown: `projectPlan.milestones.length === 0 && projectPlan.requirements.length === 0 && projectPlan.decisions.length === 0` AND the project has at least one of `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, or `.gsd/DECISIONS.md` (check `projectPlan.readiness.components` for `gsd-doc-project` etc. being `present`).
2. If true, render a prominent card at the top of the detail view (above or replacing Workflow State for this edge case).
3. Card contains:
   - "Planning Docs Detected"
   - "This repository contains GSD planning documents but they haven't been imported yet."
   - "Import All" button.
4. Add a `handleImportAll` function that calls `POST /api/projects/:id/import-all`, sets a loading state, and then calls `loadProjectPlan`.

## Inputs

- `src/App.tsx - main project detail view`

## Expected Output

- `Onboarding card UI and logic in `App.tsx``

## Verification

Build clean. In browser, select a project with docs but no imports (or manually clear imports from DB for a test project) and see the card. Click "Import All" and see data populate.
