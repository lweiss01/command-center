---
id: M005
title: "Drift repair and portfolio prioritization"
status: complete
completed_at: 2026-03-31T16:15:18.091Z
key_decisions:
  - Health and confidence are explicitly distinct: confidence = interpretation trustworthiness, health = repo operating shape
  - All health inputs are already-computed signals — no new probes added to portfolio loop
  - Grade-aware urgency: D repos score higher (need attention), A repos score lower (healthy)
  - Repair queue priority ordering: missing continuity first, then readiness, then imports, then proof
key_files:
  - server.js
  - src/App.tsx
lessons_learned:
  - Always kill backend by PID before restart — kill-port alone is not reliable in this environment; old server can keep serving stale code silently
  - Pattern: derive all health signals from already-computed objects (continuity, readiness, proofSummary, latestImportRunsByArtifact) — pure functions that compose naturally
---

# M005: Drift repair and portfolio prioritization

**Drift repair and portfolio prioritization complete \u2014 health grades on every card, Health panel with breakdown and repair queue in every repo detail view**

## What Happened

M005 made Command Center genuinely useful for managing multiple repos at once. S01 built computeRepoHealth (5-contributor 0-1 score with A-D grade) and computeRepairQueue (8-priority fix list). S02 wired health into the portfolio route and cards \u2014 every card now shows its health grade and proof coverage at a glance. S03 added the Health panel to the repo detail view with a large grade letter, score percentage, contributor breakdown with progress bars, and the staleness summary. S04 completed the loop by adding the repair queue inside the Health panel \u2014 a prioritized fix list with severity badges and target panel labels.

## Success Criteria Results

All 5 success criteria met — see M005-VALIDATION.md.

## Definition of Done Results

- **All slices complete**: S01 ✅ S02 ✅ S03 ✅ S04 ✅\n- **Build clean**: tsc -b + vite build pass throughout\n- **computeRepoHealth**: 5 named contributors, grade A-D, breakdown inspectable\n- **Portfolio cards**: health badge + proof coverage visible at a glance\n- **Health panel**: grade letter, score %, contributor breakdown bars, repair queue\n- **All changes committed**: feature + GSD artifacts on main

## Requirement Outcomes

R002 advanced: portfolio cards show health grade + proof coverage; urgency sort is health-aware. R005 advanced: repair queue with severity tells exactly what to fix. R001, R012 advanced by health breakdown surfacing stale signals explicitly.

## Deviations

None.

## Follow-ups

- Health score could eventually include a time-series trend (was it better/worse last week?) — requires storing historical scores\n- Repair queue target panel labels are text only — future improvement could scroll-to or highlight the relevant panel\n- importAgeDays on portfolio cards not yet rendered (data is present but not shown in card — could be a future tweak)
