---
estimated_steps: 5
estimated_files: 1
skills_used: []
---

# T01: Add repoHealth and repairQueue to plan response

In the GET /api/projects/:id/plan route:
1. Call computeRepoHealth({ continuity, readiness, proofSummary, latestImportRunsByArtifact }) after the existing proofSummary computation
2. Call computeRepairQueue({ continuity, readiness, proofSummary, latestImportRunsByArtifact, milestones }) for the repair queue
3. Add to res.json: repoHealth: { score, grade, breakdown }, repairQueue

Also add repoHealth to the WorkflowState evidence entry that already mentions proof — no, keep them separate. repoHealth lives at the top level of the plan response, separate from workflowState.

## Inputs

- `server.js — plan route, computeRepoHealth, computeRepairQueue`

## Expected Output

- `server.js plan route with repoHealth and repairQueue in response`

## Verification

GET /api/projects/1/plan includes repoHealth.score, repoHealth.grade, repoHealth.breakdown[], repairQueue[]. GET /api/projects/6/plan shows grade D and repairQueue with critical item.
