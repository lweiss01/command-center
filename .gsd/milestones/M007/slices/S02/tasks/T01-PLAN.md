---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Improve Next Action execution affordances

Refine Next Action panel in `src/App.tsx` for higher execution clarity: strengthen blocker emphasis, add compact run-command affordance for actionable items (copy-ready text), and preserve interpreted provenance subtitle.

## Inputs

- `Current Next Action panel implementation`
- `Existing continuity/readiness blockers`

## Expected Output

- `Updated Next Action rendering in App.tsx`
- `Visible copy-ready action command text where applicable`

## Verification

npx tsc --noEmit
Browser assertions for blocker visibility and action command affordance
