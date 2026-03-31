---
id: M004
title: "Validation and proof model"
status: complete
completed_at: 2026-03-31T04:14:54.077Z
key_decisions:
  - SUMMARY requirements_validated lives in markdown body, not frontmatter — parser targets ## Requirements Validated section
  - evidence_links reused for proof traceability with reason='requirements_validated'
  - Proof increment is +0.10 on top of existing confidence model, capped at 1.0
  - proofSummary computed from serialized milestones before passing to computeWorkflowState
key_files:
  - server.js
  - src/App.tsx
lessons_learned:
  - Always kill backend by PID before restarting — kill-port alone doesn't guarantee the new process starts
  - parseSummaryRequirementsValidated needs to handle both em-dash (—) and regular hyphen (-) as separators in the R### line format
---

# M004: Validation and proof model

**Validation and proof model complete — SUMMARY files imported as proof, milestones upgraded to proven, cockpit shows claimed vs proven with requirement traceability**

## What Happened

M004 built the validation and proof model from foundation to cockpit. S01 added gsd_summary artifact discovery and the proof_level DB column. S02 built the SUMMARY import pipeline with frontmatter and body parsers, persisting proof_level upgrades and evidence_links for requirement traceability. S03 wired the proof signal into workflowState confidence (+0.10) and exposed proofSummary in the plan response. S04 added the Proof panel to the cockpit with per-milestone claimed/proven badges, requirement proof links, and a one-click Import Summaries trigger.

## Success Criteria Results

All five success criteria met — see M004-VALIDATION.md for full checklist.

## Definition of Done Results

- **All slices complete**: S01 ✅ S02 ✅ S03 ✅ S04 ✅\n- **Build clean**: tsc -b + vite build pass with zero errors\n- **SUMMARY import non-breaking**: POST /import/summaries runs without touching existing import flows\n- **Proof panel in cockpit**: browser 5/5 assertions pass\n- **All changes committed**: feature + GSD artifact commits on main

## Requirement Outcomes

R013 validated: cockpit shows proven milestones (M001-M003) with evidence, requirement proof links sourced from SUMMARY artifacts. R001, R006, R008 advanced.

## Deviations

None.

## Follow-ups

- Proof panel currently shows 'No requirement proof links yet' on first load before Import Summaries is clicked — could be auto-triggered on scan/import in a future milestone\n- evidence_links reuse for proof is clean but the table was designed for a different purpose; a dedicated proof_links table may be worth considering for M005
