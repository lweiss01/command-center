---
estimated_steps: 12
estimated_files: 1
skills_used: []
---

# T02: Add-project form in the UI

1. Update the 'New' button in App.tsx:
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

## Inputs

- `src/App.tsx — existing sidebar layout, project list state`

## Expected Output

- `src/App.tsx with working New button and add-project form`

## Verification

Build passes. New button shows input form. Valid path adds project and selects it. Invalid path shows error inline. Cancel hides form.
