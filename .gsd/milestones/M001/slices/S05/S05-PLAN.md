# S05: Requirements import

**Goal:** Ship requirements parsing, import, provenance recording, and cockpit rendering through the same plan snapshot contract.
**Demo:** After this: After this: `.gsd/REQUIREMENTS.md` requirements can be imported through the live app and rendered in the cockpit.

## Tasks
- [x] **T01: Requirements parser, import route, provenance, and cockpit rendering shipped and verified live.** — Retroactive task for shipped requirements import: parseGsdRequirements(), importGsdRequirements(), POST /api/projects/:id/import/requirements, evidence_links provenance, and cockpit requirements rendering in App.tsx.
  - Estimate: shipped
  - Files: server.js, src/App.tsx
  - Verify: Import requirements button triggers POST route; cockpit renders imported requirement rows with status and class badges.
