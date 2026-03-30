---
id: M001
title: "Core planning model + import-first foundation"
status: complete
completed_at: 2026-03-28T03:35:31.689Z
key_decisions:
  - Single /api/projects/:id/plan endpoint assembles all imported entities plus interpreted state — frontend never derives its own judgments.
  - ARTIFACT_RULES array keeps artifact detection extensible without pipeline changes.
  - parse → upsert → import_run → evidence_link established as the canonical import pattern for all entity types.
  - Import controls and workflow state kept explainable and visibly secondary to repo docs per R008.
  - M001 scoped to import-first foundation only — workflow readiness and resume semantics intentionally deferred to M002.
key_files:
  - server.js
  - src/App.tsx
  - .gsd/milestones/M001/M001-ROADMAP.md
  - .gsd/milestones/M001/M001-VALIDATION.md
  - scripts/reconcile-gsd-runtime.mjs
lessons_learned:
  - Retroactive GSD planning requires adding at least one task per slice before the slice can be formally completed — plan this into bootstrap sessions.
  - Runtime unit cache files (.gsd/runtime/units/*.json) do not auto-reconcile from the journal after abnormal auto-mode stops — npm run gsd:reconcile-runtime fixes this.
  - The journal (.gsd/journal/*.jsonl) is the durable source of truth for unit completion; the runtime cache is a fast-path overlay that can drift.
---

# M001: Core planning model + import-first foundation

**M001 delivered and formally closed — trustworthy workspace discovery, docs-first import, canonical SQLite model, and live cockpit rendering all proven against real repos.**

## What Happened

M001 delivered the import-first foundation that Command Center needed to stop being a demo and start working against real repos. Workspace discovery, artifact detection, canonical SQLite schema, and import flows for milestones, requirements, and decisions were all shipped and verified live. The cockpit renders imported planning state alongside first-pass workflow interpretation. This session formally closed M001 by persisting the DB-backed roadmap, completing all 7 slices with retroactive task records, running validation, and recording the milestone summary. A runtime cache reconciliation utility was also added as a regression guard against future auto-mode stuck-loop failures.

## Success Criteria Results

All 7 success criteria met by live behavior:\n- Workspace discovery: 7 environments found in Project Hub ✅\n- Artifact detection: classification and planning status badges working ✅\n- Canonical model: all tables present, plan endpoint returns full snapshot ✅\n- Milestone import: 6 imported live from .gsd/PROJECT.md ✅\n- Requirements + decisions import: 20 + 4 imported live ✅\n- Cockpit shows imported state: all panels rendered ✅\n- Provenance and warnings recorded: import_runs and evidence_links populated ✅

## Definition of Done Results

- Discovery, artifact detection, schema, import, and provenance slices all complete ✅\n- Backend and frontend wired together through /api/projects/:id/plan and the cockpit ✅\n- Real local web entrypoint exercised — http://127.0.0.1:3000 loaded with no errors ✅\n- Success criteria re-checked against live behavior, not just source files ✅\n- Import foundation visible in cockpit — milestones, requirements, decisions, workflow state, continuity ✅

## Requirement Outcomes

- R007 (Docs-first durable source of truth): **Validated** — live import of milestones, requirements, and decisions from this repo's own .gsd artifacts confirmed the docs-first import path works end-to-end.\n- R008 (Low-hidden-state interpretation model): **Advanced** — canonical model established with visible provenance; later milestones must keep it subordinate to repo truth.\n- R001/R002/R003/R004/R005/R006/R009/R010/R011/R012/R013/R014: **Intentionally deferred** — all have owning slices in M002+; none are orphaned.

## Deviations

Slices were completed retroactively (work shipped before GSD tooling was bootstrapped in this repo). Richer review/confidence UX remained shallow — documented as an intentional M001 caveat, not a deviation from scope.

## Follow-ups

M002 Resume-first cockpit + workflow readiness — roadmap and slice plans already exist. S01 Workflow interpretation contract is the natural starting point. The runtime unit cache reconciliation utility (npm run gsd:reconcile-runtime) should be run after any abnormal auto-mode stop before resuming.
