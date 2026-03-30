---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Ship milestone parser, import route, provenance, and cockpit rendering

Retroactive task for shipped milestone import: parseGsdProjectMilestones(), importGsdProjectMilestones(), POST /api/projects/:id/import/milestones, evidence_links provenance, and cockpit milestone rendering in App.tsx.

## Inputs

- `S03 canonical schema`

## Expected Output

- `server.js — milestone parser and import route`
- `src/App.tsx — imported milestones panel`

## Verification

Import milestones button triggers POST route; cockpit renders imported milestone rows with status badges.
