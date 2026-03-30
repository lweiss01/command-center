---
id: T02
parent: S01
milestone: M003
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["Per-step state is keyed by step.id (bp-1, bp-2...) which is positional. On successful apply, all step state is cleared before loadProjectPlan so stale IDs don't pollute the re-rendered plan", "Confirmation panel is inline (below the step), not a modal", "Machine-level shows View Instructions panel with selectable install command, no POST is ever made"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Browser: opened filetrx project (missing .gsd/), saw Apply buttons on both repo-local steps. Clicked Apply → confirmation panel appeared with title, rationale, risk pill, Confirm/Cancel. Clicked Cancel → panel dismissed, Apply button restored. Clicked Apply again → Confirm → POST sent, .gsd/ created on disk, plan re-fetched, step count dropped from 2 to 1. Machine-tool rejection verified via curl returning 400 with explanatory error."
completed_at: 2026-03-30T01:19:54.447Z
blocker_discovered: false
---

# T02: Added per-step Apply/Confirm/Cancel and View Instructions UI with inline panels and live status feedback

> Added per-step Apply/Confirm/Cancel and View Instructions UI with inline panels and live status feedback

## What Happened
---
id: T02
parent: S01
milestone: M003
key_files:
  - src/App.tsx
key_decisions:
  - Per-step state is keyed by step.id (bp-1, bp-2...) which is positional. On successful apply, all step state is cleared before loadProjectPlan so stale IDs don't pollute the re-rendered plan
  - Confirmation panel is inline (below the step), not a modal
  - Machine-level shows View Instructions panel with selectable install command, no POST is ever made
duration: ""
verification_result: passed
completed_at: 2026-03-30T01:19:54.448Z
blocker_discovered: false
---

# T02: Added per-step Apply/Confirm/Cancel and View Instructions UI with inline panels and live status feedback

**Added per-step Apply/Confirm/Cancel and View Instructions UI with inline panels and live status feedback**

## What Happened

Added bootstrapStepStatus and bootstrapStepError state maps (keyed by step.id), cleared on project selection change. Added handleBootstrapConfirm async handler that POSTs to the apply endpoint and clears all step state before re-fetching the plan on success. Added setStepStatus/setStepError helpers. Updated BootstrapPlanStep interface to include componentId and instructions. Rewrote the bootstrap plan step rendering to show Apply or View Instructions buttons, inline confirmation panel for repo-local steps, instructions panel for machine-level steps, and status indicators (applying pill, done strikethrough, failed error message with retry).

## Verification

Browser: opened filetrx project (missing .gsd/), saw Apply buttons on both repo-local steps. Clicked Apply → confirmation panel appeared with title, rationale, risk pill, Confirm/Cancel. Clicked Cancel → panel dismissed, Apply button restored. Clicked Apply again → Confirm → POST sent, .gsd/ created on disk, plan re-fetched, step count dropped from 2 to 1. Machine-tool rejection verified via curl returning 400 with explanatory error.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `browser: Apply → confirmation panel visible` | 0 | ✅ pass | 500ms |
| 2 | `browser: Cancel → panel dismissed, Apply restored` | 0 | ✅ pass | 200ms |
| 3 | `browser: Apply → Confirm → POST 200, plan re-fetched, step removed from list` | 0 | ✅ pass | 800ms |
| 4 | `ls /c/Users/lweis/Documents/filetrx/.gsd/` | 0 | ✅ pass — dir exists | 50ms |


## Deviations

After a successful apply, step state is cleared (not set to 'done') before re-fetching the plan. This avoids ID collision bugs where positional bp-N IDs bleed stale 'done' state into a re-rendered plan with different components at the same positions. The step just disappears from the list on success, which is cleaner UX.

## Known Issues

None.

## Files Created/Modified

- `src/App.tsx`


## Deviations
After a successful apply, step state is cleared (not set to 'done') before re-fetching the plan. This avoids ID collision bugs where positional bp-N IDs bleed stale 'done' state into a re-rendered plan with different components at the same positions. The step just disappears from the list on success, which is cleaner UX.

## Known Issues
None.
