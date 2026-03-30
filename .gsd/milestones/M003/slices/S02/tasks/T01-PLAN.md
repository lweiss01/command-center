---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T01: Add previewContent + template support to bootstrap steps

Two parts:

1. Define two template presets in server.js:
   - 'minimal': current BOOTSTRAP_STUBS (single-line placeholders)
   - 'starter': richer stubs with example sections (2-4 lines each with concrete prompts)

2. Update computeBootstrapPlan to accept an optional templateId param (defaulting to 'minimal'). Add previewContent field to each step: for doc steps, the rendered stub string; for dir/tool steps, a short description string (e.g. 'Creates .gsd/ directory at <path>').

3. Update GET /api/projects/:id/plan to forward templateId query param into computeBootstrapPlan.

4. Update POST /api/projects/:id/bootstrap/apply to accept optional templateId in body and use the correct stub content when writing files.

## Inputs

- `server.js — BOOTSTRAP_STUBS, computeBootstrapPlan, apply endpoint`

## Expected Output

- `GET /api/projects/:id/plan?templateId=starter returns steps with previewContent`
- `POST apply with templateId=starter writes richer stub content`

## Verification

curl 'http://localhost:3001/api/projects/2/plan?templateId=starter' | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const p=JSON.parse(d); console.log(p.bootstrapPlan.steps[0].previewContent)" — should show multi-line starter content
