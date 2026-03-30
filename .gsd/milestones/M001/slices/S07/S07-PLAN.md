# S07: Import UX and validation

**Goal:** Make the import foundation usable and honest in the cockpit by exposing controls, warnings, and cleanup behavior around the imported entities.
**Demo:** After this: After this: import controls, warning surfaces, and stale imported row cleanup exist in the cockpit, with the known caveat that richer review semantics remain for later work.

## Tasks
- [x] **T01: Import controls, warning surfaces, and first-pass cockpit UX shipped and verified live with no console errors.** — Retroactive task for shipped import UX: import trigger buttons in App.tsx, warning surfaces (import run summaries, warning_json), stale-row cleanup on re-import, and first-pass cockpit surfaces for workflow state, continuity freshness, and next action recommendation.
  - Estimate: shipped
  - Files: server.js, src/App.tsx
  - Verify: Cockpit shows import buttons, warning states after import, workflow state, continuity freshness, and next action panel without console errors.
