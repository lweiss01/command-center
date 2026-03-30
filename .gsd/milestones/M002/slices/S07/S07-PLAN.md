# S07: One-click local launch UX

**Goal:** Make Command Center startup one-click for local Windows use by providing a desktop launcher that starts backend/frontend and opens the web app automatically.
**Demo:** After this: After this: a desktop icon launches backend + frontend and opens Command Center in the browser with no manual terminal steps.

## Tasks
- [x] **T01: Added Windows launcher and shortcut scripts so one desktop click starts backend/frontend with readiness checks and opens Command Center.** — Create a Windows launcher entrypoint that orchestrates backend + frontend startup and opens the browser at the local app URL. Add a shortcut-creation script that places/updates a desktop icon pointing at the launcher. Ensure process startup emits clear success/failure status and exits with non-zero code on startup failure.
  - Estimate: 60m
  - Files: scripts/start-command-center.ps1, scripts/create-command-center-shortcut.ps1, package.json
  - Verify: pwsh -File scripts/create-command-center-shortcut.ps1
pwsh -File scripts/start-command-center.ps1
# Confirm browser opens and both services start successfully
- [x] **T02: Added stop companion flow with dual desktop shortcuts and documented launch/stop usage.** — Add a companion stop flow for launcher ergonomics: implement `scripts/stop-command-center.ps1` to stop listeners on ports 3001/5173 with clear status output; update `scripts/create-command-center-shortcut.ps1` to create both `Command Center.lnk` and `Command Center (Stop).lnk`; add `cc:stop` npm alias; document launch/stop usage in README.
  - Estimate: 35m
  - Files: scripts/stop-command-center.ps1, scripts/create-command-center-shortcut.ps1, package.json, README.md
  - Verify: powershell -ExecutionPolicy Bypass -File scripts/create-command-center-shortcut.ps1 -Force
powershell -ExecutionPolicy Bypass -File scripts/stop-command-center.ps1
powershell -ExecutionPolicy Bypass -File scripts/start-command-center.ps1 -NoBrowser
npx tsc --noEmit
