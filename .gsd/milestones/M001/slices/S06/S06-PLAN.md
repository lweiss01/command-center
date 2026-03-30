# S06: Decisions import

**Goal:** Ship decision parsing, import, provenance recording, and cockpit rendering so architectural history is part of the imported cockpit state.
**Demo:** After this: After this: `.gsd/DECISIONS.md` decisions can be imported through the live app and rendered in the cockpit.

## Tasks
- [x] **T01: Decisions parser, import route, provenance, and cockpit rendering shipped and verified live.** — Retroactive task for shipped decisions import: parseGsdDecisions(), importGsdDecisions(), POST /api/projects/:id/import/decisions, evidence_links provenance, and cockpit decisions rendering in App.tsx.
  - Estimate: shipped
  - Files: server.js, src/App.tsx
  - Verify: Import decisions button triggers POST route; cockpit renders imported decision rows with scope and rationale.
