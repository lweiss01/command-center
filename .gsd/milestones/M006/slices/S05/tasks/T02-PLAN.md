---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T02: Browser verification of Beads context

1. Start dev server + backend.
2. Select `command-center` in UI, assert 'Beads context' appears in health breakdown as missing.
3. Select a project with `.beads` (or create a dummy one), assert 'Beads context' appears as ok with a file count.
4. No console errors.

## Inputs

- `running dev + backend`

## Expected Output

- `Verified Beads context in UI`

## Verification

browser_assert confirms Beads context is visible in the health breakdown.
