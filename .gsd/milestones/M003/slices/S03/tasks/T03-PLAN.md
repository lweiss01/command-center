---
estimated_steps: 8
estimated_files: 2
skills_used: []
---

# T03: Browser verification

End-to-end browser verification:
1. Find a project with a bootstrap gap for a doc file
2. Manually create the target file to simulate a conflict
3. Click Apply on that step — preflight fires, confirmation panel shows yellow conflict warning
4. Click Confirm anyway — file is overwritten, undo hint shown
5. Click × on undo hint — hint clears
6. Find a non-conflict step — Apply opens confirmation with no warning
7. No console errors

## Inputs

- `Running app at localhost:5173`

## Expected Output

- `All browser_assert checks pass`
- `Conflict warning and undo hint both verified`

## Verification

browser_assert: conflict warning visible after creating conflicting file. Undo hint visible after apply. No console errors.
