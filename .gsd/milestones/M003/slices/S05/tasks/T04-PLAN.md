---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T04: End-to-end verification

1. Start dev server + backend
2. Select paydirt-backend (has repo-local bootstrap gaps)
3. Apply the first step (Initialize GSD directory)
4. Reload project plan — confirm audit trail shows the entry
5. Manually remove the created directory (rm -rf paydirt-backend/.gsd)
6. Reload — confirm drift warning appears on the step and drift badge shows in section header
7. Re-apply the step — audit trail now shows two entries for the same component
8. No console errors throughout
9. Confirm no regressions: other projects unaffected, repo-local flow intact

## Inputs

- `running dev + backend`
- `paydirt-backend project`

## Expected Output

- `verified end-to-end audit + drift flow`

## Verification

browser_assert: audit trail entry visible, drift warning visible after manual removal, drift clears after re-apply. No console errors.
