---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: Browser verification of add-project

Start dev server + backend. Click New button. Enter a valid path (e.g. C:\Users\lweis\Documents\holistic). Click Add. Assert: holistic appears in the project list and is selected. Enter an invalid path. Assert: error message shown. No console errors.

## Inputs

- `running dev + backend`

## Expected Output

- `browser verification passed`

## Verification

browser_assert: add form visible after New click, project added on valid path, error shown on invalid path, no console errors.
