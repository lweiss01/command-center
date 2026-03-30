# S02: Source artifact detection

**Goal:** Extend discovered projects with real artifact detection so the system knows which planning and continuity docs exist before import begins.
**Demo:** After this: After this: the app can classify GSD/GSD2 and roadmap-like planning artifacts in discovered repos.

## Tasks
- [x] **T01: Artifact detection rules and source_artifacts persistence shipped and verified live.** — Retroactive task for shipped source artifact detection: ARTIFACT_RULES array, detectArtifacts(), source_artifacts schema, per-project artifact inventory, and planning status derivation. All work existed and was verified before this record.
  - Estimate: shipped
  - Files: server.js
  - Verify: Projects in live app show correct artifact counts and planning status badges (structured/partial/none).
