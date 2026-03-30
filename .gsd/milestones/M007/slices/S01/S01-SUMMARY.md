---
id: S01
parent: M007
milestone: M007
provides:
  - Fast self-service diagnostics before startup attempts.
  - Reliable troubleshooting guidance tied to concrete launcher commands.
  - Reduced ambiguity in launcher support and daily operations.
requires:
  []
affects:
  - S02
key_files:
  - scripts/check-command-center-launcher.ps1
  - package.json
  - README.md
key_decisions:
  - Report occupied ports as WARN (not FAIL) in preflight to keep diagnostics usable while services are already running.
  - Standardize launcher troubleshooting docs as symptom → command → inspection path.
patterns_established:
  - Local launcher workflows should include an explicit preflight diagnostic command.
  - Support docs should map symptoms to exact commands and inspection paths.
observability_surfaces:
  - `cc:doctor` preflight report (PASS/WARN/FAIL).
  - Launcher log paths documented and referenced for failure diagnosis.
drill_down_paths:
  - .gsd/milestones/M007/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M007/slices/S01/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T18:31:17.103Z
blocker_discovered: false
---

# S01: Launcher UX hardening

**Hardened launcher support flow with `cc:doctor` diagnostics and a verified troubleshooting matrix.**

## What Happened

S01 hardened launcher ergonomics with a preflight doctor command and practical troubleshooting docs. T01 introduced `cc:doctor` to validate host/tool/port/shortcut/log readiness with actionable output. T02 added a concise troubleshooting matrix and verified launch lifecycle commands remain aligned with docs.

## Verification

Verified `cc:doctor` (direct and npm alias) plus `cc:shortcut`, `cc:launch -- -NoBrowser`, and `cc:stop` command paths with successful exits.

## Requirements Advanced

- R001 — Improved day-to-day usability and trust by making launcher readiness and remediation explicit.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Launcher hardening remains Windows-focused; cross-platform launcher parity is deferred.

## Follow-ups

Proceed to S02 actionability pass in cockpit UI (Next Action affordances + browser assertions).

## Files Created/Modified

- `scripts/check-command-center-launcher.ps1` — Added launcher preflight diagnostics with PASS/WARN/FAIL output and remediation guidance.
- `package.json` — Added `cc:doctor` npm alias for launcher preflight checks.
- `README.md` — Added launcher troubleshooting matrix mapping symptoms to commands and inspection paths.
