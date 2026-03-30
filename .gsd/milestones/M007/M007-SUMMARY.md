---
id: M007
title: "Launcher hardening + cockpit iteration"
status: complete
completed_at: 2026-03-28T18:52:58.182Z
key_decisions:
  - Use `cc:doctor` preflight diagnostics with PASS/WARN/FAIL + remediation output.
  - Keep occupied ports as warnings (not hard failures) in doctor diagnostics.
  - Surface context-aware Next Action suggested command while preserving interpreted provenance subtitles.
  - Source displayed app version from package metadata via Vite define.
key_files:
  - scripts/check-command-center-launcher.ps1
  - scripts/start-command-center.ps1
  - scripts/stop-command-center.ps1
  - scripts/create-command-center-shortcut.ps1
  - src/App.tsx
  - vite.config.ts
  - src/globals.d.ts
  - README.md
  - package.json
lessons_learned:
  - PowerShell/Bash interop requires careful quoting to avoid variable expansion pitfalls.
  - Deterministic startup ports and explicit diagnostics materially improve supportability.
  - Verification tasks should document dataset constraints when target UI states are unavailable.
---

# M007: Launcher hardening + cockpit iteration

**Delivered launcher hardening and cockpit actionability improvements with preserved trust surfaces and package-driven version visibility.**

## What Happened

M007 hardened daily launcher ergonomics and iterated cockpit actionability without eroding trust surfaces. S01 added practical launcher diagnostics and troubleshooting guidance. S02 improved Next Action execution affordances, preserved interpreted/provenance visibility, and introduced package-driven footer versioning. Command and browser verification evidence confirms reliability and UX intent.

## Success Criteria Results

- ✅ Launcher reliability and supportability improved through doctor/stop/shortcut workflows.
- ✅ Cockpit actionability improved (suggested command + stronger blocker emphasis).
- ✅ Interpreted/provenance trust surfaces remained visible and regression-checked.
- ✅ Verification evidence captured and reproducible.

## Definition of Done Results

- [x] Planned slices S01 and S02 completed.
- [x] Launcher diagnostics and troubleshooting workflow are implemented and verified.
- [x] Cockpit actionability improvements shipped without trust-surface regressions.
- [x] Version display is package-driven and verified in UI.
- [x] Task/slice summaries and UAT evidence are present.

## Requirement Outcomes

- R001 advanced by reducing startup friction, improving actionable cockpit guidance, and preserving explicit provenance cues.
- No requirement invalidations occurred during M007.

## Deviations

None.

## Follow-ups

None.
