# S01: Launcher UX hardening

**Goal:** Harden launcher ergonomics and operational diagnostics for daily local use.
**Demo:** After this: After this: launcher UX feels production-ready with resilient start/stop controls and clear diagnostics.

## Tasks
- [x] **T01: Added launcher preflight diagnostics (`cc:doctor`) with actionable PASS/WARN/FAIL output.** — Add a launcher diagnostics helper script that performs startup preflight checks (PowerShell host, node/npm availability, port occupancy, shortcut target validity) and prints actionable pass/fail output. Integrate as npm alias for quick support checks.
  - Estimate: 30m
  - Files: scripts/check-command-center-launcher.ps1, package.json
  - Verify: powershell -ExecutionPolicy Bypass -File scripts/check-command-center-launcher.ps1
npm run cc:doctor
- [x] **T02: Added a launcher troubleshooting matrix to README and verified all documented launcher commands end-to-end.** — Refine launcher/stop README section with a concise troubleshooting matrix (symptom -> command -> log path) and verify all documented commands execute successfully.
  - Estimate: 25m
  - Files: README.md
  - Verify: npm run cc:shortcut
npm run cc:launch -- -NoBrowser
npm run cc:stop
