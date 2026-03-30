---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T03: Browser verification of full flow

End-to-end browser verification:
1. Pick a test repo with at least one repo-local gap and one machine-tool gap
2. Verify Apply button appears on repo-local steps, View Instructions on machine-tool steps
3. Walk through a repo-local apply: confirm dialog shows correct info, confirm executes, step shows done, readiness updates
4. Walk through machine-level: instructions panel shows correct install command, no auto-execution
5. Verify cancelling confirmation leaves repo unchanged
6. Verify a second apply on an already-present component is handled gracefully (either button is hidden or returns ok:true idempotently)

## Inputs

- `Running app`
- `A test repo with known gaps`

## Expected Output

- `browser_assert pass/fail results for each scenario`

## Verification

All browser_assert checks pass. No console errors. Repo state on disk matches UI state.
