---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Ship decisions parser, import route, provenance, and cockpit rendering

Retroactive task for shipped decisions import: parseGsdDecisions(), importGsdDecisions(), POST /api/projects/:id/import/decisions, evidence_links provenance, and cockpit decisions rendering in App.tsx.

## Inputs

- `S03 canonical schema`

## Expected Output

- `server.js — decisions parser and import route`
- `src/App.tsx — imported decisions panel`

## Verification

Import decisions button triggers POST route; cockpit renders imported decision rows with scope and rationale.
