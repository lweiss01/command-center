---
id: T02
parent: S01
milestone: M002
provides: []
requires: []
affects: []
key_files: ["server.js", "src/App.tsx"]
key_decisions: ["Confidence is additive fixed-increment (not weighted magic) — explainable and conservative", "latestImportRunsByArtifact forwarded into computeWorkflowState to enable import-recency phase detection", "evidence is {label,value}[] for aligned rendering, reasons[] is separate for explanation"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "node --input-type=module import check exits 0; tsc --noEmit exits 0; GET /api/projects/1/plan returns workflowState with phase:active, confidence:1, reasons[], evidence[]; GET /api/projects/6/plan returns phase:no-data, confidence:0 with full reasons list."
completed_at: 2026-03-28T03:44:37.373Z
blocker_discovered: false
---

# T02: Rewrote computeWorkflowState to return structured phase, numeric confidence, reasons[], and evidence[] — updated all App.tsx consumers

> Rewrote computeWorkflowState to return structured phase, numeric confidence, reasons[], and evidence[] — updated all App.tsx consumers

## What Happened
---
id: T02
parent: S01
milestone: M002
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Confidence is additive fixed-increment (not weighted magic) — explainable and conservative
  - latestImportRunsByArtifact forwarded into computeWorkflowState to enable import-recency phase detection
  - evidence is {label,value}[] for aligned rendering, reasons[] is separate for explanation
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:44:37.373Z
blocker_discovered: false
---

# T02: Rewrote computeWorkflowState to return structured phase, numeric confidence, reasons[], and evidence[] — updated all App.tsx consumers

**Rewrote computeWorkflowState to return structured phase, numeric confidence, reasons[], and evidence[] — updated all App.tsx consumers**

## What Happened

Rewrote computeWorkflowState in server.js from a string-confidence/string-evidence function to one returning { phase: 'no-data'|'import-only'|'active'|'stalled'|'blocked', confidence: number 0-1, reasons: string[], evidence: {label,value}[] }. Confidence is additive from four fixed-increment signals (milestone +0.15, requirements +0.20, decisions +0.10, import recency up to +0.25, continuity freshness up to +0.30). Reasons always populated when confidence < 1. Updated call site to forward latestImportRunsByArtifact (fixing the T01-identified gap). Updated computeNextAction phase references. Updated App.tsx WorkflowState interface, all helper functions, and JSX rendering.

## Verification

node --input-type=module import check exits 0; tsc --noEmit exits 0; GET /api/projects/1/plan returns workflowState with phase:active, confidence:1, reasons[], evidence[]; GET /api/projects/6/plan returns phase:no-data, confidence:0 with full reasons list.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node --input-type=module -e "import('./server.js')"` | 0 | ✅ pass | 3100ms |
| 2 | `npx tsc --noEmit` | 0 | ✅ pass | 3100ms |
| 3 | `GET /api/projects/1/plan → workflowState.phase='active', confidence=1` | 200 | ✅ pass | 80ms |
| 4 | `GET /api/projects/6/plan → workflowState.phase='no-data', confidence=0` | 200 | ✅ pass | 80ms |


## Deviations

None beyond fixing the T01-flagged latestImportRunsByArtifact forwarding gap, which was within scope.

## Known Issues

None.

## Files Created/Modified

- `server.js`
- `src/App.tsx`


## Deviations
None beyond fixing the T01-flagged latestImportRunsByArtifact forwarding gap, which was within scope.

## Known Issues
None.
