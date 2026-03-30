# S01: Workspace discovery

**Goal:** Ship real workspace scanning so the dashboard can discover repositories from configured roots and present them as persisted projects instead of hardcoded or seed state.
**Demo:** After this: After this: the app can scan configured roots, discover likely repos, persist project metadata, and show them in the dashboard.

## Tasks
- [x] **T01: Workspace scan route and Project Hub discovery rendering shipped and verified live.** — Retroactive task capturing the shipped workspace discovery work: scanWorkspaceRoot(), upsertProjectWithArtifacts(), detectArtifacts(), derivePlanningStatus(), scan_runs schema, /api/scan route, and Project Hub dashboard rendering. All work existed and was verified live before this task was recorded.
  - Estimate: shipped
  - Files: server.js, src/App.tsx
  - Verify: Browser shows 7 discovered environments in Project Hub. GET /api/scan returns 200 with projectsFound count.
