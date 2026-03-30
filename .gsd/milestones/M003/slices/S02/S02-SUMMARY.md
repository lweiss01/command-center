---
id: S02
parent: M003
milestone: M003
provides:
  - Template selection state (bootstrapTemplateId) for downstream slices
  - previewContent field on steps — reusable in S03 for dry-run display
requires:
  - slice: S01
    provides: apply endpoint and confirmation panel foundation
affects:
  - S03
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Two built-in presets only (minimal / starter) — no custom template path for now; extendable later
  - previewContent multiline heuristic (includes newline) determines code block vs italic description display
  - Template selection is client-side state re-fetched from server on switch, not cached in the step — keeps server as single source of truth for stub content
patterns_established:
  - Server is the source of truth for template content — UI re-fetches plan on template switch rather than computing content client-side
  - previewContent multiline heuristic for display mode: code block vs description text
observability_surfaces:
  - template: label visible in confirmation panel
  - [bootstrap/apply] log line already includes componentId+action — templateId not logged (low value)
drill_down_paths:
  - .gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T01:39:40.814Z
blocker_discovered: false
---

# S02: Template-based bootstrap source + preview

**Bootstrap confirmation panel now shows file preview with template provenance; minimal/starter presets selectable in UI**

## What Happened

S02 added template selection and file preview to the bootstrap flow. Two built-in presets let users choose between minimal (single placeholder) and starter (structured sections with example prompts) before committing a write. The confirmation panel now shows exactly what will be written to disk, including the template provenance label. The apply endpoint respects the selected template when writing files.

## Verification

Template selector renders, switches re-fetch plan, confirmation panel shows file preview with template label, apply writes starter content confirmed on disk, description-style preview for dir steps confirmed, switching templates re-fetches correctly.

## Requirements Advanced

- R001 — Users can inspect file content before committing — bootstrap is now preview-first not apply-first

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

The old process serving port 3001 from a previous session had to be killed before the updated server could start. This was a test environment issue, not a code issue.

## Known Limitations

Only two built-in templates. No custom template source (e.g. copy from another repo) yet \u2014 that was scoped out of M003 per the CONTEXT-DRAFT.

## Follow-ups

S03 (safe apply engine + approval gates) is the natural next step: dry-run preview, rollback guidance, and higher-risk mutation handling.

## Files Created/Modified

- `server.js` — Added BOOTSTRAP_STUBS_MINIMAL, BOOTSTRAP_STUBS_STARTER, getBootstrapStubs(), getStepPreviewContent(); updated computeBootstrapPlan to accept templateId+projectName and add previewContent+templateId to steps; plan route forwards ?templateId; apply endpoint uses selected template stubs
- `src/App.tsx` — Added bootstrapTemplateId state and useEffect; template selector in Bootstrap Plan header; loadProjectPlan threads templateId; confirmation panel renders file preview block or description text with template provenance label
