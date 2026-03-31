---
id: T02
parent: S04
milestone: M003
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["Stage gate uses IIFE pattern (immediately invoked arrow fn) to share stageGateActive across stages.map iterations", "activeInstallTab state per step avoids shared tab selection state conflicts", "copiedStepId state drives 2s Copied! feedback without additional useEffect"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Build passes clean (tsc -b + vite build). Browser: paydirt-backend project shows repo-local bootstrap steps. Apply→Confirm panel opens, Cancel returns to pending. No console errors throughout."
completed_at: 2026-03-31T00:38:41.306Z
blocker_discovered: false
---

# T02: Updated instructions panel with clipboard copy, verify button, multi-variant tabs, and stage gate

> Updated instructions panel with clipboard copy, verify button, multi-variant tabs, and stage gate

## What Happened
---
id: T02
parent: S04
milestone: M003
key_files:
  - src/App.tsx
key_decisions:
  - Stage gate uses IIFE pattern (immediately invoked arrow fn) to share stageGateActive across stages.map iterations
  - activeInstallTab state per step avoids shared tab selection state conflicts
  - copiedStepId state drives 2s Copied! feedback without additional useEffect
duration: ""
verification_result: passed
completed_at: 2026-03-31T00:38:41.306Z
blocker_discovered: false
---

# T02: Updated instructions panel with clipboard copy, verify button, multi-variant tabs, and stage gate

**Updated instructions panel with clipboard copy, verify button, multi-variant tabs, and stage gate**

## What Happened

Added installCommands and platform fields to BootstrapPlanStep and ProjectPlan types. Added verifying to StepStatus. Added activeInstallTab and copiedStepId state. Implemented handleVerifyTool that calls verify-tool endpoint and transitions to done or back to instructions with inline error. Replaced the stages.map with an IIFE that computes stageGateActive once (repo-local steps all done) and passes it into each stage render. Machine-level card shows a warning banner when gate is active. View Instructions button is disabled+greyed when gate is active. Instructions panel upgraded: multi-variant tabs showing npm/brew/winget with platform-native tab highlighted, clipboard copy with 2s Copied! feedback, and Verify button with verifying state and inline error on missing. Error message now also shows in instructions state (not just failed).

## Verification

Build passes clean (tsc -b + vite build). Browser: paydirt-backend project shows repo-local bootstrap steps. Apply→Confirm panel opens, Cancel returns to pending. No console errors throughout.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 4900ms |
| 2 | `browser_assert: Bootstrap Plan visible, Repo-local setup visible, Initialize GSD directory visible, no_console_errors` | 0 | ✅ pass — 4/4 checks | 2000ms |
| 3 | `browser: Apply→confirm panel→Cancel round-trip` | 0 | ✅ pass — no regression | 1500ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/App.tsx`


## Deviations
None.

## Known Issues
None.
