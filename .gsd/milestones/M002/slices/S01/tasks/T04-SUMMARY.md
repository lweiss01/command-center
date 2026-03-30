---
id: T04
parent: S01
milestone: M002
provides: []
requires: []
affects: []
key_files: ["server.js", "src/App.tsx"]
key_decisions: ["Dropped priority in favor of blockers[] — non-empty blockers is a clearer binary than high/medium/low label", "Blocker text includes context (status, ageHours) not a generic message"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit exits 0. node server.js import exits 0. GET /api/projects/1/plan returns action/rationale/blockers:[] (clear path). GET /api/projects/6/plan returns blockers with missing-continuity entry."
completed_at: 2026-03-28T03:53:47.580Z
blocker_discovered: false
---

# T04: Rewrote computeNextAction to return {action, rationale, blockers[]} with directive action text and explicit blocker list

> Rewrote computeNextAction to return {action, rationale, blockers[]} with directive action text and explicit blocker list

## What Happened
---
id: T04
parent: S01
milestone: M002
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Dropped priority in favor of blockers[] — non-empty blockers is a clearer binary than high/medium/low label
  - Blocker text includes context (status, ageHours) not a generic message
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:53:47.581Z
blocker_discovered: false
---

# T04: Rewrote computeNextAction to return {action, rationale, blockers[]} with directive action text and explicit blocker list

**Rewrote computeNextAction to return {action, rationale, blockers[]} with directive action text and explicit blocker list**

## What Happened

Replaced computeNextAction in server.js from {label, reason, priority} to {action, rationale, blockers[]}. Action is an imperative sentence. Rationale explains the choice. Blockers is empty when clear, context-rich when continuity is missing or stale (includes status and ageHours). Dropped priority field entirely — non-empty blockers is a clearer signal. Updated App.tsx NextAction interface, removed getNextActionPriorityClassName, added getNextActionBlockersPresent, replaced priority badge with Blocked/Clear badge, added blockers list in UI.

## Verification

npx tsc --noEmit exits 0. node server.js import exits 0. GET /api/projects/1/plan returns action/rationale/blockers:[] (clear path). GET /api/projects/6/plan returns blockers with missing-continuity entry.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 2300ms |
| 2 | `node --input-type=module -e "import('./server.js')"` | 0 | ✅ pass | 1700ms |
| 3 | `GET /api/projects/1/plan → nextAction.action present, blockers:[]` | 200 | ✅ pass | 50ms |
| 4 | `GET /api/projects/6/plan → nextAction.blockers has missing-continuity entry` | 200 | ✅ pass | 50ms |


## Deviations

Dropped priority field entirely rather than preserving alongside blockers — cleaner contract.

## Known Issues

None.

## Files Created/Modified

- `server.js`
- `src/App.tsx`


## Deviations
Dropped priority field entirely rather than preserving alongside blockers — cleaner contract.

## Known Issues
None.
