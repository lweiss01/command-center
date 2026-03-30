---
depends_on: [M001]
---

# M002: Resume-first cockpit + workflow readiness — Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

## Project Description

M002 turns Command Center from an import-first foundation into a resume-first cockpit that helps the user understand where a repo stands, what happened last, what is still unresolved, what is missing from the standard workflow stack, and what to do next. It should help the user see across repos and then into one repo without losing memory or nuance.

## Why This Milestone

Importing docs is necessary but not sufficient. The real value is giving the user a truthful, low-bloat view across many repos so they can prioritize time effectively and safely resume work after interruptions. M002 is where Command Center starts behaving like that product rather than only a planning importer.

## User-Visible Outcome

### When this milestone is complete, the user can:

- open a repo and immediately see its current workflow phase, continuity freshness, readiness against the standard stack, what is next, and what is still unresolved
- compare repos by freshness, readiness, unresolved work, and next-step urgency without manually reading every repo’s docs first

### Entry point / environment

- Entry point: local web app at `http://127.0.0.1:3000` with the Express bridge on `http://localhost:3001`
- Environment: local dev / browser
- Live dependencies involved: repo-local docs, local tool availability, Holistic continuity artifacts, future Beads / GSD / GSD2 detection surfaces

## Completion Class

- Contract complete means: backend workflow-readiness and cockpit-state contracts are documented and returned with explainable evidence
- Integration complete means: the UI renders continuity, readiness, unresolved-state, and next-step surfaces from real backend payloads across real repos
- Operational complete means: stale continuity and missing workflow components are visible in normal repo selection and prioritization flows

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- a selected repo can show current workflow state, continuity freshness, readiness gaps, unresolved work, and next-step guidance in one coherent cockpit view
- the portfolio view can help the user decide which repo deserves attention next using freshness/readiness/uncertainty signals rather than raw artifact lists
- missing workflow components are surfaced clearly enough that the user knows what must be fixed before normal work can proceed

## Risks and Unknowns

- Workflow readiness can easily turn into brittle checklist software if it is not grounded in real usage and clear evidence — this matters because the product must stay sharp rather than PM-ish
- Cross-repo comparison can become fake certainty if confidence, missing evidence, and unresolved work are not surfaced honestly — this matters because the user wants truth, not dashboards that overclaim
- Continuity signals may lag behind real repo state if checkpoint hygiene is stale or inconsistent — this matters because resume quality is a core promise

## Existing Codebase / Prior Art

- `server.js` — already computes first-pass `workflowState`, `continuity`, and `nextAction`; this is the base to deepen rather than replace
- `src/App.tsx` — already renders workflow phase, confidence, continuity freshness, next action, and import controls
- `ROADMAP.md` — captures the earlier M002 direction around workflow-state, Holistic continuity, Beads translation, and cross-repo comparison
- `.holistic/` — repo-local continuity memory that should remain first-class in the cockpit

> See `.gsd/DECISIONS.md` for all architectural and pattern decisions — it is an append-only register; read it during planning, append to it during execution.

## Relevant Requirements

- R001 — truthful repo cockpit
- R002 — cross-repo prioritization view
- R003 — continuity freshness and memory surfaces
- R004 — workflow readiness detection for the standard stack
- R005 — missing-component verification surface
- R006 — repo drill-down for what’s next and what’s unresolved
- R008 — low-hidden-state interpretation model
- R011 — discussion and research visibility
- R012 — Holistic checkpoint hygiene reminders
- R014 — anti-bloat product boundary

## Scope

### In Scope

- explainable workflow-state contract and confidence rules
- continuity freshness, checkpoint hygiene, and last-work surfaces
- readiness detection for repo-local docs and callable workflow tools
- repo drill-down for next-step, unresolved-state, and open-loop visibility
- cross-repo prioritization based on freshness, readiness, and uncertainty
- clear separation between imported facts, interpreted state, and missing evidence

### Out of Scope / Non-Goals

- fully automatic repo or machine bootstrap without staged approval
- proof/validation semantics beyond first-pass readiness and confidence surfaces
- deep Beads graph translation if it bloats M002 beyond resume-first value
- turning the product into Mission Control-style orchestration or generic PM software

## Technical Constraints

- Prefer repo-local durable truth over hidden central-only state
- Keep workflow interpretation conservative and explainable
- Surface uncertainty and missing evidence instead of smoothing them away
- Favor staged repair guidance over invasive automatic setup

## Integration Points

- Holistic — continuity freshness, latest work, checkpoint hygiene, resume guidance
- GSD / GSD2 — workflow readiness detection and repo-local planning artifact presence
- Beads — eventual readiness and task-graph signal integration, starting from honest detection
- local machine tool availability — callable workflow component checks

## Open Questions

- How deep should machine-level readiness/install checks go before the product feels invasive? — Current thinking: detect first, offer staged fixes, ask before higher-blast-radius changes
- How much of discussion/research uncertainty can be surfaced mechanically versus manually curated docs? — Current thinking: preserve repo-local artifacts and augment them with light interpretation
