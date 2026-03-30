---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T05: Update cockpit to render structured workflow signals visibly

Update src/App.tsx to render the new structured workflowState, continuity, and nextAction fields. Show: workflow phase label with appropriate color coding, confidence percentage or indicator, at least the first reason/evidence item, continuity status and age, next action as a directive callout, blockers list if non-empty. Keep the UI lean — this is signal display, not a full dashboard rebuild. Ensure no console errors on load for any discovered repo including repos with missing continuity.

## Inputs

- `T02`
- `T03`
- `T04 updated plan payload`

## Expected Output

- `src/App.tsx: updated workflow state, continuity, and next action panels rendering structured fields`

## Verification

Browser: cockpit for command-center repo shows workflow phase, confidence, at least one evidence/reason item, continuity status, next action, and zero console errors.
