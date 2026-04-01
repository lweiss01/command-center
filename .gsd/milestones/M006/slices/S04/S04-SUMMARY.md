---
id: S04
parent: M006
milestone: M006
provides:
  - Repo tagging functionality.
  - `repo_tag` database column and related endpoint.
requires:
  - slice: M005/S01
    provides: Health score logic to inject modifications.
affects:
  - S05
  - S06
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - `archive` tags completely bypass health logic to avoid generating visual noise for intentionally inactive projects, pushing them to the bottom of the list.
  - `minimal` tags are checked during health calculation to explicitly bypass checks that require documentation, like import recency and proof coverage, providing a 100% score for these specific fields so they do not artificially deflate the health score.
patterns_established:
  - Using additive schema migrations on local SQLite databases to safely introduce new columns without wiping previous data.
observability_surfaces:
  - Health grade calculation and Portfolio lists sorting natively by urgency.
drill_down_paths:
  - .gsd/milestones/M006/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M006/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M006/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T00:23:09.942Z
blocker_discovered: false
---

# S04: Repo tagging (active / minimal / archive)

**Repo tagging (active / minimal / archive) persists in DB, influences health scores, and deprioritizes in urgency sorting.**

## What Happened

S04 introduces the ability to tag repositories as either `active`, `minimal`, or `archive`. By tagging repositories, users can suppress health noise and sort the portfolio view by meaningful metrics. This change implements `repo_tag` inside the `projects` table using an additive schema migration. Health scoring was updated: `archive` ignores the score completely to sink it to the bottom, while `minimal` explicitly handles required documentation checks safely by bypassing them to preserve the health grade. UI modifications add a toggle drop-down on the project detail view to quickly shift a project's state.

## Verification

The change has been manually run using node scripts and via UI inspection with automated browser checks, confirming that `archive` and `minimal` behave effectively.

## Requirements Advanced

- R002 — By allowing users to designate their repository intents via tags, we're building better portfolio views.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `server.js` — Added repo_tag to schema and updated health and urgency formulas.
- `src/App.tsx` — Added tag UI to project detail header and portfolio cards.
