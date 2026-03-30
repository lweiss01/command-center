---
estimated_steps: 8
estimated_files: 4
skills_used: []
---

# T01: Create UX baseline audit and signal taxonomy

Produce a premium-grade UX/UI baseline audit of the current Command Center interface focused on clarity, actionability, accessibility semantics, and visual hierarchy.

Steps:
1) Inventory all first-use and daily-use surfaces in `src/App.tsx` (header, project cards, panels, imports, navigation).
2) Map current signals shown to users (phase, continuity, readiness, planning status, unresolved/gaps).
3) Identify defects with severity (P0/P1/P2), user impact, and code anchors.
4) Define an explicit signal taxonomy for project cards and top-level cockpit surfaces.
5) Define acceptance criteria for S02/S03/S04 redesign slices.
6) Produce verification checklist for browser-level and accessibility-level validation.

## Inputs

- `ROADMAP.md`
- `.gsd/milestones/M008/M008-ROADMAP.md`
- `src/App.tsx`
- `docs/USER-GUIDE.md`
- `README.md`

## Expected Output

- `.gsd/milestones/M008/slices/S01/S01-RESEARCH.md`
- `updated .gsd/milestones/M008/slices/S01/S01-PLAN.md task checklist via tooling`

## Verification

Confirm artifact exists and includes: prioritized findings, signal taxonomy table, slice acceptance criteria, verification checklist.
