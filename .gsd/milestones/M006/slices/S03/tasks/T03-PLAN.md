---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T03: Verify first-run onboarding flow

End-to-end browser verification:
1. Start dev server + backend.
2. Use sqlite to delete import runs and milestone/req/decision data for `holistic` project to simulate a fresh state.
3. Select `holistic` in UI.
4. Assert onboarding card is visible.
5. Click "Import All".
6. Assert panels populate and card disappears.
7. Restore state or just let the import keep it restored.
8. No console errors.

## Inputs

- `running dev + backend`

## Expected Output

- `Verified first-run onboarding flow in browser`

## Verification

browser_assert confirms card appears, button is clickable, and state updates.
