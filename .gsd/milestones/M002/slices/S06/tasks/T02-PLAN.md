---
estimated_steps: 5
estimated_files: 1
skills_used:
  - frontend-design
  - react-best-practices
---

# T02: Surface import provenance timing and mark portfolio interpreted badges

**Slice:** S06 — Trust and anti-hidden-state surfaces
**Milestone:** M002

## Description

Use existing import metadata already present in `ProjectPlan` to surface "Last synced" provenance in imported-entity sections, and add a compact interpreted marker to portfolio phase/continuity badges so interpreted signals are not mistaken for ground truth.

This task remains in `src/App.tsx` and must avoid backend changes.

## Steps

1. Add lightweight helpers in `src/App.tsx` to format import completion time and source label text from existing `latestImportRunsByArtifact` values.
2. Render provenance text near Imported Milestones, Imported Requirements, and Imported Decisions section headers.
3. Mark portfolio interpreted badges (phase and continuity) with a compact epistemic marker that keeps card density stable.
4. Ensure fallback text is clear when sync metadata is missing.
5. Run TypeScript verification and quick UI sanity pass for header/badge spacing.

## Must-Haves

- [ ] Imported Milestones/Requirements/Decisions headers each show last-sync provenance using existing metadata.
- [ ] Portfolio phase/continuity badges are visibly marked as interpreted.
- [ ] Layout remains compact and aligned with current card/header styling.

## Verification

- `npx tsc --noEmit`
- Manual review: provenance text appears in all three imported-data headers and interpreted marker appears on portfolio phase/continuity badges.

## Observability Impact

- Signals added/changed: explicit freshness/source provenance for imported entities and interpreted badge marker in portfolio cards.
- How a future agent inspects this: verify "Last synced" copy and interpreted badge marker in UI without opening backend logs.
- Failure state exposed: stale/unknown provenance is explicit instead of implicit.

## Inputs

- `src/App.tsx` — Existing import-run metadata usage and portfolio badge rendering.
- `.gsd/milestones/M002/slices/S06/tasks/T01-PLAN.md` — Prior task conventions for interpretation labeling.

## Expected Output

- `src/App.tsx` — Added import provenance helpers/rendering and interpreted portfolio badge marker.
- `.gsd/milestones/M002/slices/S06/tasks/T02-PLAN.md` — Completed executor plan for this task.
