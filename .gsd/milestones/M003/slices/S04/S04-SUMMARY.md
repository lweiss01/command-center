---
id: S04
parent: M003
milestone: M003
provides:
  - machine-level install instructions with OS-aware command variants
  - clipboard copy for install commands
  - verify-tool round-trip for post-install confirmation
  - stage gate preventing premature machine-level access
requires:
  - slice: S03
    provides: safe apply engine for repo-local steps
affects:
  - S05
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Stage gate implemented via IIFE in stages.map to share repoLocalAllDone across stage iterations
  - selectInstallCommand uses winget→npm on Windows, brew→npm on macOS, npm on Linux
  - Verify-tool re-runs computeReadiness fresh to avoid caching stale probe results
  - copiedStepId state (not per-step) is sufficient since only one Copy action can be in flight at a time
patterns_established:
  - Stage gate pattern: compute repoLocalAllDone before stages.map and pass as closure to gate dependent stage UI
  - Verify-tool pattern: re-run computeReadiness fresh on demand, no override cache
  - Per-step state maps (activeInstallTab, copiedStepId) keep tab/copy state isolated per step
observability_surfaces:
  - [bootstrap/verify-tool] server log with project, component, and result
drill_down_paths:
  - .gsd/milestones/M003/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T00:39:24.886Z
blocker_discovered: false
---

# S04: Machine-level setup assistant (secondary stage)

**Machine-level setup assistant with clipboard copy, verify button, multi-variant tabs, and stage gate"**

## What Happened

S04 adds the machine-level setup assistant as a secondary bootstrap stage. When repo-local setup is complete but tools are missing, Command Center now offers install instructions with OS-aware command variants (npm/brew/winget), clipboard copy with feedback, a verify round-trip that re-probes tool presence, and a stage gate that prevents machine-level steps from being accessed until all repo-local steps are done. T01 (server-side) was already substantially complete from prior work — this session confirmed and verified it. T02 built the full UI in App.tsx. T03 confirmed no regressions to the repo-local apply/confirm flow.

## Verification

All 3 tasks complete. Build clean. Browser assertions pass (4/4). API verify-tool endpoint returns correct responses. Repo-local apply/confirm flow unaffected.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Machine-level steps with missing tools could not be exercised end-to-end in the browser since both holistic and gsd tools are present on this machine. API-level verification confirms correct endpoint behaviour.

## Follow-ups

None.

## Files Created/Modified

- `server.js` — Added selectInstallCommand helper, COMPONENT_META installCommands for holistic-tool/gsd-tool, machine-level step installCommands attachment, GET /api/projects/:id/bootstrap/verify-tool endpoint, platform field in plan response
- `src/App.tsx` — Added installCommands/platform types, verifying StepStatus, handleVerifyTool, activeInstallTab/copiedStepId state, stage gate banner + gating logic, multi-variant install tabs, clipboard copy button, verify button with inline error
