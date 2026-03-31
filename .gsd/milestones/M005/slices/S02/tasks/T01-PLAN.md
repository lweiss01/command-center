---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Wire health into portfolio route and urgency score

In the portfolio route, compute proofSummary from raw milestone rows, call computeRepoHealth, add health fields to each entry. Update computeUrgencyScore signature to accept repoHealth and replace +0.15 readiness-gap check with grade-aware increments (D:+0.20, C:+0.10, A:-0.10 floored at 0). Update the single call site.

## Inputs

- `server.js — computeRepoHealth, computeUrgencyScore, portfolio route`

## Expected Output

- `server.js with health in portfolio route and urgency score updated`

## Verification

GET /api/portfolio: each entry has healthScore, healthGrade, proofCoverage, importAgeDays. command-center grade A, paydirt-backend grade D.
