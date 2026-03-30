---
id: S07
parent: M002
milestone: M002
provides:
  - Desktop icon startup for backend+frontend with optional browser open.
  - Desktop icon stop control for backend/frontend services.
  - Documented launcher commands for terminal and desktop workflows.
requires:
  - slice: S06
    provides: Trust surface clarity from S06; S07 builds on this by making access/startup frictionless.
affects:
  []
key_files:
  - scripts/start-command-center.ps1
  - scripts/stop-command-center.ps1
  - scripts/create-command-center-shortcut.ps1
  - package.json
  - README.md
key_decisions:
  - Use strict Vite host/port (`127.0.0.1:5173 --strictPort`) for deterministic readiness.
  - Resolve PowerShell host dynamically (`pwsh` fallback to `powershell`) for broad Windows compatibility.
  - Include both start and stop desktop shortcuts as first-class controls.
patterns_established:
  - Launcher UX should provide both start and stop controls, not start-only flows.
  - Port-based readiness and stop checks should be deterministic and explicit for local tooling ergonomics.
observability_surfaces:
  - Startup logs written to `.logs/command-center-backend.log` and `.logs/command-center-frontend.log`.
  - Launcher and stopper console status messages for startup readiness, already-running detection, stop actions, and failures.
drill_down_paths:
  - .gsd/milestones/M002/slices/S07/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S07/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T18:13:02.365Z
blocker_discovered: false
---

# S07: One-click local launch UX

**Delivered one-click Windows launch/stop desktop controls for Command Center with verified start-stop-restart reliability.**

## What Happened

S07 delivered one-click local startup ergonomics for Command Center on Windows. T01 implemented startup orchestration plus desktop shortcut creation for launch. T02 added a companion stop flow, created dual desktop shortcuts (Launch and Stop), and documented usage in README. Verification covered shortcut generation, cold start, relaunch idempotence, stop/restart behavior, endpoint health, and TypeScript checks.

## Verification

Verified shortcut creation, cold start health, relaunch idempotence, stop flow, restart after stop, and `npx tsc --noEmit` pass.

## Requirements Advanced

- R001 — Improved day-to-day cockpit usability by removing manual multi-command startup friction and making service state control explicit.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Launcher scripts are Windows-specific; no macOS/Linux launcher shortcut flow implemented in this slice.

## Follow-ups

Evaluate custom icon assets and optional toast notifications for launcher UX.

## Files Created/Modified

- `scripts/start-command-center.ps1` — Added one-click launcher orchestration with readiness checks and startup logging.
- `scripts/stop-command-center.ps1` — Added launcher stop flow for backend/frontend listener ports.
- `scripts/create-command-center-shortcut.ps1` — Extended shortcut generation to create both launch and stop desktop icons.
- `package.json` — Added launcher npm aliases for launch, stop, and shortcut creation.
- `README.md` — Documented Windows one-click launcher usage.
