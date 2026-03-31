---
estimated_steps: 17
estimated_files: 2
skills_used: []
---

# T01: Add proof increment to computeWorkflowState and proofSummary to plan response

1. Add proofSummary parameter to computeWorkflowState signature: computeWorkflowState({ milestones, requirements, decisions, continuity, readiness, latestImportRunsByArtifact, proofSummary })
   where proofSummary = { claimed: number, proven: number, total: number } | null

2. Add proof increment block after existing confidence increments:
   if (proofSummary && proofSummary.proven > 0) {
     confidence = Math.min(1.0, confidence + 0.10);
     evidence.push({ label: 'Proof', value: `${proofSummary.proven}/${proofSummary.total} milestones proven` });
     reasons.push(`${proofSummary.proven} milestone(s) have verified completion evidence`);
   }

3. In the GET /api/projects/:id/plan route handler, compute proofSummary before calling computeWorkflowState:
   const proofSummary = (() => {
     if (!milestones.length) return null;
     const proven = milestones.filter(m => m.proofLevel === 'proven').length;
     const claimed = milestones.filter(m => m.status === 'done' && m.proofLevel !== 'proven').length;
     return { proven, claimed, total: milestones.length };
   })();
   Pass proofSummary into computeWorkflowState and also include it in the res.json response.

4. Update the TypeScript App.tsx interface for WorkflowState to add optional proofSummary field (needed for S04).

## Inputs

- `server.js computeWorkflowState, plan route`
- `src/App.tsx WorkflowState interface`

## Expected Output

- `server.js with proof confidence increment`
- `App.tsx WorkflowState type updated`

## Verification

GET /api/projects/1/plan: workflowState.confidence for command-center (has proven milestones) is 0.10 higher than a bare repo. proofSummary present with proven:3+, claimed:0, total:N. GET /api/projects/2/plan: workflowState unchanged.
