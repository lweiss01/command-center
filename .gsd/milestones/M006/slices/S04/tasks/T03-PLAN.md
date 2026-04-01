---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T03: Browser verification of Repo Tagging

1. Start dev server + backend.
2. Select a project (e.g. `filetrx` which was D).
3. Change tag to `minimal`. Assert health score improves and breakdown shows minimal notes.
4. Change tag to `archive`. Assert it drops to the bottom of the portfolio list (urgency < 0).
5. Assert portfolio card shows "Archive" badge.
6. No console errors.

## Inputs

- `running dev + backend`

## Expected Output

- `Verified tagging flow in browser`

## Verification

browser_assert confirms the tagging UI changes the card and list order.
