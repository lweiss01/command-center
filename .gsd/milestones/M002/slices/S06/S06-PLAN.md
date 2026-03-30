# S06: Trust and anti-hidden-state surfaces

**Goal:** Make cockpit trust surfaces explicit by clearly labeling interpreted conclusions versus imported facts, and by showing import provenance timing so users can inspect freshness instead of inferring hidden state.
**Demo:** After this: After this: the UI clearly distinguishes imported facts, interpreted conclusions, and missing evidence so the cockpit does not feel opaque or PM-ish.

## Tasks
- [x] **T01: Updated all five interpreted cockpit panel subtitles to explicitly communicate derived/interpreted provenance.** — Update interpretation panel sub-labels in `src/App.tsx` so users can distinguish computed conclusions from imported facts.

Apply the existing mono uppercase sub-label style pattern already used in these panels; keep copy concise and anti-bloat.

Cover all interpretation surfaces in repo detail view:
- Workflow State
- Workflow Readiness
- Continuity
- Next Action
- Open Loops

Do not introduce new backend fields; this task is render-copy clarity only.

Add deterministic browser assertions (via existing verification flow) that confirm the new derivation language is visible in the rendered cockpit.
  - Estimate: 35m
  - Files: src/App.tsx
  - Verify: npx tsc --noEmit
- [x] **T02: Added import provenance timing/source lines to imported headers and marked portfolio phase/continuity badges as interpreted.** — Use existing import-run metadata in `src/App.tsx` to show provenance and freshness near raw imported-entity sections, and mark portfolio interpretation badges as interpreted.

Implement lightweight helpers in `src/App.tsx` for:
- formatting 'last synced' timestamps from `latestImportRunsByArtifact.*.completedAt`
- mapping artifact context to explicit source labels (`.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/DECISIONS.md`, milestones source label as currently represented)

Render provenance lines in section headers for:
- Imported Milestones
- Imported Requirements
- Imported Decisions

Update portfolio card interpreted badges (phase/continuity) with an epistemic marker that remains compact and readable.

Verify with runtime browser assertions that 'Last synced' provenance and interpreted badge markers are visible, then run typecheck.
  - Estimate: 45m
  - Files: src/App.tsx
  - Verify: npx tsc --noEmit
