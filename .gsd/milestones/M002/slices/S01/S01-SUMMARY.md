---
id: S01
parent: M002
milestone: M002
provides:
  - Structured workflowState contract: {phase, confidence, reasons[], evidence[]} with five phase values and additive fixed-increment confidence
  - Structured continuity contract: {status, freshAt, ageHours, latestWork, checkpointHygiene, hygieneNote} sourced from Holistic state.json
  - Structured nextAction contract: {action, rationale, blockers[]} with directive text and explicit blocker list
  - App.tsx rendering panels for all three structured outputs with color-coded badges and evidence display
  - KNOWLEDGE.md initialized with S01 patterns and Windows-specific gotchas
requires:
  []
affects:
  - S02 — continuity hygiene reminders now have a richer struct (checkpointHygiene, hygieneNote, ageHours) to build on
  - S03 — readiness detection signals will plug into computeWorkflowState confidence as additional increments
  - S04 — repo drill-down can reuse workflowState.evidence[] and continuity.latestWork for the 'what happened last' surface
  - S06 — trust surfaces will expose the confidence breakdown table using the reasons[] and evidence[] already produced here
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Confidence is additive fixed-increment — explainable and conservative by design, no weighted magic
  - latestImportRunsByArtifact forwarded into computeWorkflowState to enable import-recency phase detection
  - evidence is {label,value}[] for aligned rendering, reasons[] is separate for explanation
  - Three continuity statuses only: fresh/stale/missing — no 'aging' fourth value
  - checkpointHygiene derived from lastCheckpointAt/lastHandoffAt in Holistic state.json
  - priority field dropped from nextAction in favor of blockers[] — non-empty blockers is a clearer binary
patterns_established:
  - Structured interpretation return types: phase+confidence+reasons[]+evidence[] for workflow state, status+hygiene fields for continuity, action+rationale+blockers[] for next action
  - Confidence is a sum of named fixed increments — each signal's contribution is documented by name
  - Blockers list pattern: empty when path is clear, context-rich strings (includes status and ageHours) when blocking
  - App.tsx follows the pattern: interface defined at top, helper functions mid-file, JSX rendering at bottom — each interpretation function maps to one dedicated panel section
observability_surfaces:
  - GET /api/projects/:id/plan now returns workflowState.phase, confidence, reasons[], evidence[], continuity.status, ageHours, checkpointHygiene, nextAction.action, rationale, blockers[] — full explainability surface via API
  - Cockpit renders phase badge, confidence %, evidence table, continuity panel with age, next action callout, and conditional blockers list
drill_down_paths:
  - milestones/M002/slices/S01/tasks/T01-SUMMARY.md
  - milestones/M002/slices/S01/tasks/T02-SUMMARY.md
  - milestones/M002/slices/S01/tasks/T03-SUMMARY.md
  - milestones/M002/slices/S01/tasks/T04-SUMMARY.md
  - milestones/M002/slices/S01/tasks/T05-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:59:04.405Z
blocker_discovered: false
---

# S01: Workflow interpretation contract

**Deepened the three core interpretation functions to return structured, explainable outputs and updated the cockpit to render them — replacing opaque scalar signals with phase, confidence, evidence, continuity, and next-action panels.**

## What Happened

S01 audited, rewrote, and verified the three interpretation functions that form the backend reasoning core of Command Center's cockpit.

**T01 (audit):** Read all three functions in server.js in full and traced their call sites in the plan route and App.tsx. Documented current shapes (string confidence, string[] evidence, {label,reason,priority}) and target shapes, and identified a forwarding gap — latestImportRunsByArtifact was assembled in the plan route but never passed into computeWorkflowState, meaning import-recency-based phase detection was impossible.

**T02 (computeWorkflowState):** Rewrote to return `{ phase: 'no-data'|'import-only'|'active'|'stalled'|'blocked', confidence: number 0–1, reasons: string[], evidence: {label,value}[] }`. Confidence is additive fixed-increment: milestone +0.15, requirements +0.20, decisions +0.10, import recency up to +0.25, continuity freshness up to +0.30. Reasons and evidence are always populated when confidence < 1. Fixed the T01-identified forwarding gap. Updated App.tsx interfaces, helper functions, and JSX.

**T03 (computeContinuity):** Rewrote to return `{ status: 'fresh'|'stale'|'missing', freshAt, ageHours, latestWork, checkpointHygiene: 'ok'|'stale'|'missing', hygieneNote }`. Reads from `{rootPath}/.holistic/state.json` when present; falls back to 'missing' when absent. checkpointHygiene is derived from lastCheckpointAt/lastHandoffAt keys in Holistic state. Updated all consumers (computeWorkflowState confidence signal, computeNextAction branching, App.tsx panel).

**T04 (computeNextAction):** Replaced `{ label, reason, priority }` with `{ action, rationale, blockers[] }`. Action is a directive imperative sentence. Blockers is empty when the path is clear; contains context-rich entries (status, ageHours) when continuity is missing or stale. Dropped priority entirely. Updated App.tsx to show Blocked/Clear badge and conditional blockers list.

**T05 (browser verification):** Found all structured rendering already in place from T02–T04. Ran end-to-end browser verification against the running cockpit — 10/10 assertions passed, zero console errors. TypeScript compiles clean. T05 was a pure verification task with no code changes needed.

## Verification

All slice-level verification passed:
- `npx tsc --noEmit` → exit 0
- `node --input-type=module -e "import('./server.js')"` → exit 0 (server starts, bridge active on :3001)
- `GET /api/projects/1/plan` → workflowState.phase='active', confidence=1, reasons[] (array, 1 item), evidence[] (array, 5 items), continuity.status='fresh', continuity.checkpointHygiene='stale', nextAction.action=string, nextAction.rationale=string, nextAction.blockers[]=[]
- Browser 10/10 assertions from T05: Workflow State panel visible, Phase badge, Confidence percentage, Evidence items, Continuity panel, Status badge, Next Action panel, directive sentence, Clear badge, zero console errors

## Requirements Advanced

- R001 — computeWorkflowState now returns an explainable phase, numeric confidence, reasons[], and evidence[] — the cockpit shows structured signals rather than opaque scalars

## Requirements Validated

- R001 — GET /api/projects/1/plan returns workflowState with phase='active', confidence=1, reasons[], evidence[5 items]; browser 10/10 assertions pass showing phase badge, confidence %, evidence items, continuity panel, next action callout with zero console errors

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T05 required no code changes — T02/T03/T04 had already implemented all structured rendering as part of their own scope. T04 dropped the priority field entirely rather than preserving it alongside blockers[], which is a clean contract simplification rather than a deviation from intent.

## Known Limitations

computeWorkflowState does not yet distinguish between 'stalled' (data present but import recency aged out) and 'blocked' (explicit blocker artifacts detected). Stalled/blocked phase detection is conservative and will improve once S02 (continuity hygiene) and S03 (readiness detection) feed richer signals in.

## Follow-ups

S02 should wire checkpointHygiene age reminders more prominently into the cockpit now that the continuity struct exposes hygieneNote. S03 readiness detection will provide additional confidence signals for computeWorkflowState. S06 (trust surfaces) should make the confidence breakdown table inspectable in the UI.

## Files Created/Modified

- `server.js` — Rewrote computeWorkflowState, computeContinuity, computeNextAction with structured return types; forwarded latestImportRunsByArtifact into computeWorkflowState
- `src/App.tsx` — Updated WorkflowState, Continuity, NextAction interfaces; updated all helper functions and JSX panels to render structured outputs
- `.gsd/DECISIONS.md` — Appended D006–D008: confidence model, dropped priority field, three-value continuity status
- `.gsd/KNOWLEDGE.md` — Created with S01 patterns and Windows-specific gotchas
- `.gsd/PROJECT.md` — Updated current state to reflect M002/S01 completion
