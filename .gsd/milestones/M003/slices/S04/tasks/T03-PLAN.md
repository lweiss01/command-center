---
estimated_steps: 10
estimated_files: 2
skills_used: []
---

# T03: End-to-end browser verification of machine-level assistant

End-to-end browser verification:
1. Start dev server and backend, navigate to Command Center
2. Select a project that has machine-level gaps (holistic-tool or gsd-tool missing)
3. Verify machine-level stage card is present and stage gate banner shows if repo-local steps are pending
4. Complete or dismiss repo-local steps — confirm stage gate banner disappears
5. Click 'View Instructions' on a machine-level step — panel opens with correct install command
6. Click Copy — browser clipboard API called (assert no console error)
7. Click 'I installed this — verify' — verify endpoint called, result shown correctly
8. Check multi-variant tabs if more than one command variant available
9. No console errors throughout

## Inputs

- `src/App.tsx`
- `server.js`

## Expected Output

- `Browser verification passed with no console errors`

## Verification

browser_assert: stage gate banner visible when repo-local pending. Instructions panel renders. Verify button triggers network request. No console errors.
