---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Deepen computeWorkflowState to return structured phase, confidence, reasons, evidence

Rewrite computeWorkflowState(inputs) to return { phase: string, confidence: number (0-1), reasons: string[], evidence: { label, value }[] }. Phase values: 'no-data' | 'import-only' | 'active' | 'stalled' | 'blocked'. Confidence is derived from: milestone presence, requirement coverage, import recency, continuity freshness. Reasons and evidence are the explicit signals that produced the phase and confidence — never empty if confidence < 1. Keep the function conservative and explainable — no weighted scoring magic.

## Inputs

- `T01 audit notes`

## Expected Output

- `server.js: updated computeWorkflowState returning structured object`

## Verification

node -e "import('./server.js')" starts without error. GET /api/projects/:id/plan returns workflowState with phase, confidence, reasons[], evidence[] fields.
