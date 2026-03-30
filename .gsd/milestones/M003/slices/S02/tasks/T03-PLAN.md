---
estimated_steps: 8
estimated_files: 2
skills_used: []
---

# T03: Browser verification

End-to-end verification:
1. Open a project with at least one doc-creation bootstrap step
2. Verify template selector shows 'minimal' and 'starter' options
3. Switch to 'starter' — verify step preview content updates
4. Click Apply on a doc step in starter mode — confirm panel shows file preview with richer content
5. Confirm — verify written file on disk matches starter template
6. Switch back to minimal — verify preview content reverts
7. No console errors throughout

## Inputs

- `Running app at localhost:5173`

## Expected Output

- `All browser_assert checks pass`
- `File content on disk matches selected template`

## Verification

browser_assert: template selector visible, preview content present in confirmation panel. cat written file to confirm content matches template.
