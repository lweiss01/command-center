---
id: T01
parent: S02
milestone: M005
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["computeUrgencyScore: grade D/C/A adjustment replaces the flat +0.15 readiness-gaps check — more nuanced and health-aware", "floor at 0 added to urgencyScore to prevent negative scores when grade A deduction applied"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "GET /api/portfolio: command-center healthGrade=A, paydirt-backend healthGrade=D. All entries have healthScore, healthGrade, proofCoverage, importAgeDays."
completed_at: 2026-03-31T16:05:27.828Z
blocker_discovered: false
---

# T01: Health wired into portfolio route and urgency score

> Health wired into portfolio route and urgency score

## What Happened
---
id: T01
parent: S02
milestone: M005
key_files:
  - server.js
key_decisions:
  - computeUrgencyScore: grade D/C/A adjustment replaces the flat +0.15 readiness-gaps check — more nuanced and health-aware
  - floor at 0 added to urgencyScore to prevent negative scores when grade A deduction applied
duration: ""
verification_result: passed
completed_at: 2026-03-31T16:05:27.830Z
blocker_discovered: false
---

# T01: Health wired into portfolio route and urgency score

**Health wired into portfolio route and urgency score**

## What Happened

Portfolio route now computes proofSummary from raw milestone rows (proof_level field), calls computeRepoHealth, and adds healthScore/healthGrade/proofCoverage/importAgeDays to each entry. computeUrgencyScore updated to accept repoHealth and use grade-aware adjustments. API verified: command-center grade A, paydirt-backend grade D.

## Verification

GET /api/portfolio: command-center healthGrade=A, paydirt-backend healthGrade=D. All entries have healthScore, healthGrade, proofCoverage, importAgeDays.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `GET /api/portfolio (node -e)` | 0 | ✅ pass — health fields present, grades correct | 200ms |


## Deviations

None. importAgeDays derived inline from latestImportRunsByArtifact rather than exposing a helper from computeRepoHealth, since the portfolio route already has all three run references handy.

## Known Issues

None.

## Files Created/Modified

- `server.js`


## Deviations
None. importAgeDays derived inline from latestImportRunsByArtifact rather than exposing a helper from computeRepoHealth, since the portfolio route already has all three run references handy.

## Known Issues
None.
