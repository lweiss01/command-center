---
estimated_steps: 8
estimated_files: 1
skills_used: []
---

# T03: Verify both functions against real repo data

Start the backend, fetch real plan data for command-center (id=1) and paydirt-backend (id=6), call both functions with the real signals, print the output, and assert the expected values:

command-center:
- score >= 0.60 (grade B or A)
- repair queue empty or only low-severity

paydirt-backend:
- score < 0.60 (grade C or D)
- repair queue has at least one item, top item is critical or high severity

No server changes in this task — pure verification only.

## Inputs

- `running backend`
- `real plan signals from API`

## Expected Output

- `verification output printed to stdout confirming both functions work on real data`

## Verification

node script: fetch /api/projects/:id/plan for both repos, call functions, assert expected grades and repair queue shapes.
