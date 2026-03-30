---
id: T01
parent: S07
milestone: M002
provides: []
requires: []
affects: []
key_files: ["scripts/start-command-center.ps1", "scripts/create-command-center-shortcut.ps1", "package.json", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M002/slices/S07/tasks/T01-SUMMARY.md"]
key_decisions: ["Resolve PowerShell host dynamically (`pwsh` fallback to `powershell`) for launcher compatibility across Windows environments.", "Run Vite with `--host 127.0.0.1 --port 5173 --strictPort` so readiness checks and browser URL are deterministic.", "Tee backend/frontend startup output into repo-local `.logs/` files for inspectable failure diagnostics."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Shortcut creation command succeeded and created `Command Center.lnk` on Desktop. Launcher command succeeded in `-NoBrowser` mode with backend/frontend readiness confirmed. Backend API responded at `/api/projects`; frontend loaded at `http://localhost:5173` in browser. TypeScript compile check passed (`npx tsc --noEmit`)."
completed_at: 2026-03-28T17:59:30.726Z
blocker_discovered: false
---

# T01: Added Windows launcher and shortcut scripts so one desktop click starts backend/frontend with readiness checks and opens Command Center.

> Added Windows launcher and shortcut scripts so one desktop click starts backend/frontend with readiness checks and opens Command Center.

## What Happened
---
id: T01
parent: S07
milestone: M002
key_files:
  - scripts/start-command-center.ps1
  - scripts/create-command-center-shortcut.ps1
  - package.json
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M002/slices/S07/tasks/T01-SUMMARY.md
key_decisions:
  - Resolve PowerShell host dynamically (`pwsh` fallback to `powershell`) for launcher compatibility across Windows environments.
  - Run Vite with `--host 127.0.0.1 --port 5173 --strictPort` so readiness checks and browser URL are deterministic.
  - Tee backend/frontend startup output into repo-local `.logs/` files for inspectable failure diagnostics.
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:59:30.730Z
blocker_discovered: false
---

# T01: Added Windows launcher and shortcut scripts so one desktop click starts backend/frontend with readiness checks and opens Command Center.

**Added Windows launcher and shortcut scripts so one desktop click starts backend/frontend with readiness checks and opens Command Center.**

## What Happened

Implemented one-click startup on Windows using `scripts/start-command-center.ps1` plus `scripts/create-command-center-shortcut.ps1`. The launcher resolves `pwsh`/`powershell`, validates node/npm availability, starts backend (`node server.js`) and frontend (`npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`) in separate PowerShell windows, waits for readiness on ports 3001/5173, writes runtime logs to `.logs/`, and opens the browser unless `-NoBrowser` is provided. Added npm aliases in `package.json` for launcher and shortcut creation.

## Verification

Shortcut creation command succeeded and created `Command Center.lnk` on Desktop. Launcher command succeeded in `-NoBrowser` mode with backend/frontend readiness confirmed. Backend API responded at `/api/projects`; frontend loaded at `http://localhost:5173` in browser. TypeScript compile check passed (`npx tsc --noEmit`).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `powershell -ExecutionPolicy Bypass -File scripts/create-command-center-shortcut.ps1 -Force` | 0 | ✅ pass | 2400ms |
| 2 | `powershell -ExecutionPolicy Bypass -File scripts/start-command-center.ps1 -NoBrowser` | 0 | ✅ pass | 6900ms |
| 3 | `curl -sSf http://localhost:3001/api/projects > /dev/null && echo "backend-ok"` | 0 | ✅ pass | 200ms |
| 4 | `browser_navigate http://localhost:5173 (title: command-center)` | 0 | ✅ pass | 900ms |
| 5 | `npx tsc --noEmit` | 0 | ✅ pass | 5200ms |
| 6 | `powershell -NoProfile -Command 'desktop shortcut Test-Path check'` | 0 | ✅ pass | 300ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `scripts/start-command-center.ps1`
- `scripts/create-command-center-shortcut.ps1`
- `package.json`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M002/slices/S07/tasks/T01-SUMMARY.md`


## Deviations
None.

## Known Issues
None.
