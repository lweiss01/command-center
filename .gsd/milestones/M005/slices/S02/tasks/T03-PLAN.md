---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: Browser verification of portfolio cards

Start dev server + backend. browser_assert: portfolio cards visible, health grade letter appears on cards, no console errors. Verify API response includes all new fields.

## Inputs

- `running dev + backend`

## Expected Output

- `verified portfolio cards show health data`

## Verification

browser_assert: health grade visible, no console errors. GET /api/portfolio confirms healthScore/healthGrade/proofCoverage/importAgeDays.
