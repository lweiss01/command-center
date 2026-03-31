# S03: Proof signal in workflowState confidence + plan response — UAT

**Milestone:** M004
**Written:** 2026-03-31T04:09:40.636Z

## S03 UAT\n\n1. GET /api/projects/1/plan → proofSummary.proven >= 3, workflowState.evidence includes Proof entry\n2. GET /api/projects/2/plan → proofSummary=null, no proof evidence entry\n3. confidence <= 1.0 for all projects
