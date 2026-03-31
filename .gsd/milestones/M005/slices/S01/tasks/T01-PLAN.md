---
estimated_steps: 15
estimated_files: 1
skills_used: []
---

# T01: Write computeRepoHealth function

Write computeRepoHealth({ continuity, readiness, workflowState, proofSummary, latestImportRunsByArtifact }) in server.js.

Health contributors (additive, each named):
- continuity_status: +0.25 if fresh, +0.10 if stale, +0 if missing
- checkpoint_hygiene: +0.15 if ok, +0.05 if stale, +0 if missing
- readiness: +0.20 if ready, +0.10 if partial, +0 if missing
- import_recency: +0.20 if any import within 7 days, +0.10 if within 30 days, +0 if older/never
- proof_coverage: +0.20 if proofSummary.proven > 0, proportional up to +0.20 (proven/total * 0.20)

Total max = 1.0. Cap at 1.0.

Grade:
- A: score >= 0.80
- B: score >= 0.60
- C: score >= 0.35
- D: score < 0.35

breakdown: array of { signal: string, label: string, contribution: number, maxContribution: number, status: 'ok'|'warn'|'danger'|'missing', note: string }

Return: { score, grade, breakdown }

## Inputs

- `server.js — existing signal shapes: continuity, readiness, workflowState, proofSummary, latestImportRunsByArtifact`

## Expected Output

- `computeRepoHealth function in server.js`

## Verification

node inline test: call with signals from command-center (expected grade A or B) and paydirt-backend (expected grade C or D). Print score, grade, breakdown.
