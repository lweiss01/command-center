---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T04: Deepen computeNextAction to return structured action, rationale, and blockers

Rewrite computeNextAction(inputs) to return { action: string, rationale: string, blockers: string[] }. The action should be the single clearest next step given phase, continuity status, and readiness signals available. Blockers is the explicit list of things preventing normal work — empty array when path is clear. Action text should be directive and short (imperative sentence). Rationale explains why this action was chosen.

## Inputs

- `T02 updated workflowState`
- `T03 updated continuity`

## Expected Output

- `server.js: updated computeNextAction returning structured action/rationale/blockers`

## Verification

GET /api/projects/:id/plan returns nextAction with action, rationale, blockers[] fields.
