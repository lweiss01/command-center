---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Audit and document the current interpretation seam

Read computeWorkflowState, computeContinuity, and computeNextAction in server.js. Document what each currently returns, what inputs it uses, and what structured output shape we want to replace it with. Identify which fields are already present in the plan payload and which are missing.

## Inputs

- `.gsd/milestones/M002/M002-CONTEXT.md`
- `.gsd/DECISIONS.md`

## Expected Output

- `Inline notes in task summary describing current shape and target shape for all three functions`

## Verification

Task summary documents current return shapes and target structured shapes for computeWorkflowState, computeContinuity, computeNextAction.
