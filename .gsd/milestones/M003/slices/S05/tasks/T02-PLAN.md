---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T02: Add /api/projects/:id/bootstrap/audit endpoint with drift detection

1. Add GET /api/projects/:id/bootstrap/audit:
   - Query bootstrap_actions for project_id ordered by applied_at DESC
   - For each row, re-probe the component's current status via computeReadiness
   - If the component was applied but is now missing → drift: true
   - Return: { entries: [{ id, componentId, action, stage, path, templateId, appliedAt, sourceGap, currentStatus, drift }], driftCount: N }
   - Log: [bootstrap/audit] project=X entries=N drift=M

2. Include driftCount in the existing /api/projects/:id/plan response by calling a lightweight version (just the count) so the Bootstrap Plan section can show a drift badge without a separate fetch.

## Inputs

- `server.js — audit table from T01, computeReadiness`

## Expected Output

- `server.js with /bootstrap/audit endpoint`

## Verification

GET /api/projects/:id/bootstrap/audit returns entries array and driftCount. Apply a step, then simulate drift by renaming the created file, and confirm drift:true appears for that entry.
