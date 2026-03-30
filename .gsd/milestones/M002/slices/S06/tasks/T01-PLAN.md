---
estimated_steps: 4
estimated_files: 1
skills_used:
  - frontend-design
  - react-best-practices
---

# T01: Add derivation labels across interpreted cockpit panels

**Slice:** S06 — Trust and anti-hidden-state surfaces
**Milestone:** M002

## Description

Make interpretation boundaries explicit in repo-detail cockpit panels by adding concise derivation language where the UI currently presents computed outputs as if they were raw facts.

This task is presentation-only in `src/App.tsx`; no backend field additions.

## Steps

1. Locate the existing panel subtitle blocks for Workflow State, Workflow Readiness, Continuity, Next Action, and Open Loops in `src/App.tsx`.
2. Update subtitle copy to include consistent interpreted/derived provenance phrasing while preserving current typography and compact layout.
3. Keep wording anti-bloat and inspectable (one short line per panel; no tooltip/modal/instructional UI).
4. Run TypeScript verification and check for any JSX/layout regressions in the modified panel blocks.

## Must-Haves

- [ ] All five interpretation panels include explicit derivation/provenance wording.
- [ ] Existing class/style pattern is reused (no new visual system introduced).
- [ ] No API contract or server changes are introduced.

## Verification

- `npx tsc --noEmit`
- Manual review: `src/App.tsx` contains explicit interpreted/derived subtitle copy in all five target panels.

## Observability Impact

- Signals added/changed: visible interpretation provenance copy at the point of use.
- How a future agent inspects this: open repo detail view and confirm panel subtitles communicate derivation source.
- Failure state exposed: hidden-state ambiguity regression is visible as missing derivation labels.

## Inputs

- `src/App.tsx` — Existing interpreted panel layout and subtitle copy to update.

## Expected Output

- `src/App.tsx` — Updated interpretation panel subtitles with explicit derivation language.
- `.gsd/milestones/M002/slices/S06/tasks/T01-PLAN.md` — Completed executor plan for this task.
