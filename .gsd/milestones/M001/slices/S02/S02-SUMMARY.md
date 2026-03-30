---
id: S02
parent: M001
milestone: M001
provides:
  - source_artifacts rows with artifact_type and path for S03 canonical import
requires:
  - slice: S01
    provides: Persisted project rows
affects:
  - S03
key_files:
  - server.js
key_decisions:
  - ARTIFACT_RULES array keeps detection extensible without pipeline changes.
patterns_established:
  - ARTIFACT_RULES → detectArtifacts() → source_artifacts as the detection pipeline
observability_surfaces:
  - source_artifacts table
  - Planning status badges on project cards
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T03:33:37.384Z
blocker_discovered: false
---

# S02: Source artifact detection

**Artifact detection rules and source_artifacts persistence ship real artifact classification from repo-local docs.**

## What Happened

ARTIFACT_RULES detects .gsd/PROJECT.md, REQUIREMENTS.md, DECISIONS.md, ROADMAP.md, and others. source_artifacts rows persist with type, path, and confidence. derivePlanningStatus() maps artifact presence to structured/partial/none badges. Verified live: command-center shows 5 sources / STRUCTURED.

## Verification

Live: project cards show correct artifact counts. M001-VALIDATION.md: PASS.

## Requirements Advanced

- R007 — Artifact detection classifies repo-local planning docs as the basis for docs-first import.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. Retroactive completion.

## Known Limitations

None beyond M001 scope.

## Follow-ups

None.

## Files Created/Modified

- `server.js` — ARTIFACT_RULES, detectArtifacts, source_artifacts schema, derivePlanningStatus
