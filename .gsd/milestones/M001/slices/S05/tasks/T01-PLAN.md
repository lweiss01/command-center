---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Ship requirements parser, import route, provenance, and cockpit rendering

Retroactive task for shipped requirements import: parseGsdRequirements(), importGsdRequirements(), POST /api/projects/:id/import/requirements, evidence_links provenance, and cockpit requirements rendering in App.tsx.

## Inputs

- `S03 canonical schema`

## Expected Output

- `server.js — requirements parser and import route`
- `src/App.tsx — imported requirements panel`

## Verification

Import requirements button triggers POST route; cockpit renders imported requirement rows with status and class badges.
