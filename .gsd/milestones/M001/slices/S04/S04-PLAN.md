# S04: Milestone import

**Goal:** Ship milestone parsing, import, provenance recording, and cockpit rendering through the real frontend/backend path.
**Demo:** After this: After this: `.gsd/PROJECT.md` milestones can be imported through the live app and rendered in the cockpit.

## Tasks
- [x] **T01: Milestone parser, import route, provenance, and cockpit rendering shipped and verified live.** — Retroactive task for shipped milestone import: parseGsdProjectMilestones(), importGsdProjectMilestones(), POST /api/projects/:id/import/milestones, evidence_links provenance, and cockpit milestone rendering in App.tsx.
  - Estimate: shipped
  - Files: server.js, src/App.tsx
  - Verify: Import milestones button triggers POST route; cockpit renders imported milestone rows with status badges.
