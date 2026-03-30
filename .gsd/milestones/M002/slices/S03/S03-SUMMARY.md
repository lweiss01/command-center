---
id: S03
parent: M002
milestone: M002
provides:
  - computeReadiness(project) function in server.js — 10-component stack audit returning {overallReadiness, components, gaps}
  - readiness field on the plan API response
  - Workflow Readiness panel in App.tsx cockpit
  - StackComponent and ReadinessReport TypeScript interfaces
  - getReadinessClassName helper for readiness status styling
requires:
  - slice: S01
    provides: computeWorkflowState and computeNextAction function signatures that S03 extends with readiness parameter
affects:
  - S04 — repo drill-down can now consume readiness from the plan API
  - M003/S01 — staged bootstrap flows depend on the readiness detection contract
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - execFileSync with timeout:2000 + stdio:'pipe' for tool probes — any error = missing
  - Readiness guard fires before continuity guard in computeNextAction (harder constraint first)
  - No confidence increment — model already caps at 1.0, readiness affects phase/evidence/reasons/blockers only
  - getReadinessClassName reuses existing CSS class pattern (status-fresh/stale/missing) from continuity
  - Readiness panel guarded by projectPlan?.readiness existence check
  - ES module import { execFileSync } — not CommonJS require
patterns_established:
  - Tool-callability probing pattern: execFileSync with 2s timeout, any error = missing — use this pattern for any future machine-tool readiness checks
  - Readiness-before-continuity ordering in computeNextAction — harder structural constraints should fire before softer continuity signals
observability_surfaces:
  - readiness field on /api/projects/:id/plan response — exposes overallReadiness, 10-component status list, and gaps array
  - workflowState.evidence['Readiness'] — surfaces readiness in the explainable evidence trail
  - workflowState.reasons — includes stack-gap description when partial or missing
  - nextAction.blockers — lists missing required components by label
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T16:36:39.644Z
blocker_discovered: false
---

# S03: Workflow readiness detection

**Added computeReadiness() to server.js (10-component stack audit) and a Workflow Readiness panel to App.tsx — repos now surface which workflow components are present or missing, with gaps wired into workflowState evidence, reasons, and nextAction blockers.**

## What Happened

S03 delivered in two tasks with no blockers or replans.

**T01 — computeReadiness in server.js**: Added a `computeReadiness(project)` function that audits 10 workflow components: `.gsd/` dir, `.gsd/PROJECT.md`, `.gsd/preferences.md`, REQUIREMENTS.md, DECISIONS.md, KNOWLEDGE.md, `.holistic/` dir, Holistic tool callability, GSD tool callability, and `.beads/` dir. Repo-dir and repo-doc components use `fs.existsSync`. Machine-tool components use `execFileSync` with a 2-second timeout — any error (ENOENT, timeout, non-zero exit) marks the component 'missing'. The function builds a `gaps` array of required-but-missing labels and an `overallReadiness` value ('ready' | 'partial' | 'missing'). Integration points: readiness evidence injected into `computeWorkflowState`; stack-gap reason pushed into `workflowState.reasons` when partial/missing; `overallReadiness === 'missing'` forces phase to 'blocked'; `computeNextAction` guards on readiness before continuity (harder constraint first) and appends gaps to `blockers[]`. Live API verification showed: `overallReadiness: 'partial'`, 10 components, gaps `['Holistic (tool)', 'GSD (tool)']`, evidence and reasons populated, blockers forwarded correctly.

**T02 — Readiness panel in App.tsx**: Added `StackComponent` and `ReadinessReport` TypeScript interfaces, extended `ProjectPlan` with `readiness: ReadinessReport`, and added a `getReadinessClassName` helper (reusing the same CSS class pattern as continuity). Inserted the Workflow Readiness panel between Workflow State and Continuity panels, guarded by `projectPlan?.readiness`. The panel renders: a section heading, an overall readiness badge, a per-component list with ✓/✗ indicators plus required/note annotations, and a Gaps section when gaps exist. TypeScript check (`npx tsc --noEmit`) passed with zero errors. Browser assertions confirmed the panel renders with correct text, status badge, component list, and zero console errors.

## Verification

Two-layer verification:

1. **API layer** — Live `GET /api/projects/1/plan` response confirmed: `readiness.overallReadiness='partial'`, `readiness.components.length=10`, `readiness.gaps=['Holistic (tool)','GSD (tool)']`, `workflowState.evidence` contains `{label:'Readiness',value:'partial'}`, `workflowState.reasons` contains the stack-gap description, `nextAction.blockers=['Holistic (tool)','GSD (tool)']`. Node exit code 0.

2. **Type + browser layer** — `npx tsc --noEmit` exit code 0. Browser assertions: `text_visible 'Workflow Readiness'` ✅, `text_visible 'Standard stack audit'` ✅, `text_visible 'Readiness: partial'` ✅, `no_console_errors` ✅. Panel renders all 10 components and 2 gaps correctly.

## Requirements Advanced

- R004 — computeReadiness() audits all 10 components of the standard workflow stack (GSD dir+docs, Holistic dir+tool, GSD tool, Beads dir) and returns overallReadiness
- R005 — Readiness panel in App.tsx explicitly shows each component's present/missing status, notes, and a Gaps list with actionable labels

## Requirements Validated

- R004 — Live API returns readiness.components (10 items), overallReadiness='partial', gaps=['Holistic (tool)','GSD (tool)'] — standard stack audit confirmed working
- R005 — Browser assertions confirm Workflow Readiness panel renders with component list, status badge, and gap labels visible — missing pieces surfaced clearly in the cockpit

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. All tasks executed as planned with no replans or scope changes.

## Known Limitations

Tool callability probes for Holistic and GSD are machine-scoped, not repo-scoped. If a tool is installed in a non-standard PATH location, it will be marked 'missing' even if it is technically available. This is acceptable for the current use case (standard installations) but could be a false positive in unusual environments.

## Follow-ups

S04 can now consume `readiness` from the plan API to surface "not ready for normal work" context in the repo drill-down view. M003/S01 (staged bootstrap flows) depends directly on the readiness detection contract established here.

## Files Created/Modified

- `server.js` — Added computeReadiness(project) function, integrated into computeWorkflowState, computeNextAction, and plan route response
- `src/App.tsx` — Added StackComponent/ReadinessReport interfaces, extended ProjectPlan, added getReadinessClassName helper, added Workflow Readiness panel to cockpit JSX
