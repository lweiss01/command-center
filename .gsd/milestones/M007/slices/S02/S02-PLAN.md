# S02: Cockpit feature iteration

**Goal:** Improve cockpit actionability so users can move from signal to next step faster without losing trust-surface clarity.
**Demo:** After this: After this: cockpit iteration improves day-to-day clarity/usability while preserving explicit trust signals.

## Tasks
- [x] **T01: Improved Next Action actionability with suggested command affordance and stronger blocker emphasis.** — Refine Next Action panel in `src/App.tsx` for higher execution clarity: strengthen blocker emphasis, add compact run-command affordance for actionable items (copy-ready text), and preserve interpreted provenance subtitle.
  - Estimate: 45m
  - Files: src/App.tsx
  - Verify: npx tsc --noEmit
Browser assertions for blocker visibility and action command affordance
- [x] **T02: Captured browser assertion evidence for Next Action blocked-state actionability and preserved interpreted/provenance label coverage.** — Add deterministic browser verification checks covering updated Next Action states (clear vs blocked) and ensure derived/provenance labels remain visible in all interpreted panels.
  - Estimate: 35m
  - Files: src/App.tsx
  - Verify: Run browser checks for Next Action clear/blocked states + interpreted/provenance label visibility
