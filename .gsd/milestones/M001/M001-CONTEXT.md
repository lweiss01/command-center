# M001: Core planning model + import-first foundation — Context

**Gathered:** 2026-03-27
**Status:** Ready for validation

## Project Description

M001 established the local foundation that lets Command Center discover repos, detect repo-local planning artifacts, import core planning entities into a canonical SQLite model, and render those imported surfaces in the cockpit. This milestone is the point where the product stopped being a seed/demo and became a working import-first foundation.

## Why This Milestone

Without a trustworthy import and provenance layer, Command Center would have no honest basis for any later cockpit, readiness, prioritization, or validation features. This milestone mattered because the product’s job is to understand repo state that already exists, not invent a detached control plane.

## User-Visible Outcome

### When this milestone is complete, the user can:

- scan a workspace and see discovered repos with artifact counts and planning status
- select a repo and import milestones, requirements, and decisions from repo-local `.gsd` docs into the cockpit

### Entry point / environment

- Entry point: local web app at `http://127.0.0.1:3000` backed by the Express bridge on `http://localhost:3001`
- Environment: local dev / browser
- Live dependencies involved: SQLite database, local filesystem, repo-local planning docs

## Completion Class

- Contract complete means: canonical schema, import routes, import parsers, provenance recording, and cockpit rendering exist and pass build/runtime checks
- Integration complete means: the frontend can call the backend import routes and render imported planning entities without request failures
- Operational complete means: the local bridge starts cleanly and the browser UI loads without console/network failures

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a workspace scan detects real repos and artifact presence from disk
- the cockpit can render imported planning entities from repo-local docs through the live backend/frontend path
- the foundation works in the running app, not only as static code

## Risks and Unknowns

- Import UX depth remained shallow at the end of M001 — richer review/confidence labels were not yet complete
- This repo had no `.gsd` docs during the audit — the final validation pass must bootstrap them and then prove the import path against this repo’s own planning artifacts

## Existing Codebase / Prior Art

- `server.js` — workspace discovery, artifact detection, canonical schema, import flows, workflow-state/continuity payload assembly
- `src/App.tsx` — project cockpit UI, import controls, imported milestone/requirement/decision rendering, first-pass workflow/continuity surfaces
- `ROADMAP.md` — historical reconstruction of M001 scope, audit notes, and initial M002 direction

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R007 — validates the docs-first durable source-of-truth model
- R008 — establishes the internal canonical interpretation layer that later milestones must keep subordinate to repo truth

## Scope

### In Scope

- repo discovery and artifact detection
- canonical planning schema and import provenance
- import of milestones, requirements, and decisions into the live cockpit
- live build/runtime audit and bootstrap proof against this repo’s new `.gsd` artifacts

### Out of Scope / Non-Goals

- slice/task import
- richer review/confidence UX beyond the first-pass surfaces
- apples-to-apples cross-repo prioritization semantics
- workflow readiness detection for the full standard stack

## Technical Constraints

- The import model must remain docs-first and repo-first rather than replacing repo-local planning state with opaque internal-only truth
- Validation must rely on live behavior where possible, not only code inspection

## Integration Points

- local filesystem — artifact discovery and markdown import
- SQLite — canonical planning and provenance persistence
- browser UI — rendering imported planning entities in the cockpit

## Open Questions

- How deep should import review state go before it starts to feel like generic PM software? — Current thinking: keep it explainable and light
- How much historical planning state should be imported before the cockpit becomes visually noisy? — Current thinking: start with the highest-value entities and add depth carefully
