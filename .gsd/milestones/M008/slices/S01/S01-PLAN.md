# S01: UX Baseline Audit and Signal Taxonomy

**Goal:** Turn qualitative UX complaints into a concrete redesign contract (labels, hierarchy, semantics, action model).
**Demo:** After this: After this slice, we have a documented UI audit with prioritized defects, explicit signal taxonomy, and acceptance criteria for each redesign target.

## Tasks
- [x] **T01: Created and saved the M008/S01 UX baseline audit and signal taxonomy contract.** — Produce a premium-grade UX/UI baseline audit of the current Command Center interface focused on clarity, actionability, accessibility semantics, and visual hierarchy.

Steps:
1) Inventory all first-use and daily-use surfaces in `src/App.tsx` (header, project cards, panels, imports, navigation).
2) Map current signals shown to users (phase, continuity, readiness, planning status, unresolved/gaps).
3) Identify defects with severity (P0/P1/P2), user impact, and code anchors.
4) Define an explicit signal taxonomy for project cards and top-level cockpit surfaces.
5) Define acceptance criteria for S02/S03/S04 redesign slices.
6) Produce verification checklist for browser-level and accessibility-level validation.
  - Estimate: M
  - Files: .gsd/milestones/M008/slices/S01/S01-PLAN.md, src/App.tsx, docs/USER-GUIDE.md, README.md
  - Verify: Confirm artifact exists and includes: prioritized findings, signal taxonomy table, slice acceptance criteria, verification checklist.
