---
id: T01
parent: S03
milestone: M008
provides: []
requires: []
affects: []
key_files: ["src/App.tsx"]
key_decisions: ["New Project demoted to disabled ghost button with title='Coming soon' — removes trust-break of a non-functional primary CTA.", "User Guide demoted to muted text link — keeps it discoverable without competing with operational actions.", "Scan Workspace promoted as sole filled primary CTA — matches actual first-use workflow.", "Reordered left-to-right: utility → deemphasised → primary."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm run build clean. Source grep confirms New Project is disabled with Coming soon title; User Guide is text-slate-400 link; Scan Workspace is bg-blue-600 primary."
completed_at: 2026-03-28T22:19:06.478Z
blocker_discovered: false
---

# T01: Established header action hierarchy: demoted dead-end CTA, promoted Scan Workspace as primary, made User Guide a quiet utility link.

> Established header action hierarchy: demoted dead-end CTA, promoted Scan Workspace as primary, made User Guide a quiet utility link.

## What Happened
---
id: T01
parent: S03
milestone: M008
key_files:
  - src/App.tsx
key_decisions:
  - New Project demoted to disabled ghost button with title='Coming soon' — removes trust-break of a non-functional primary CTA.
  - User Guide demoted to muted text link — keeps it discoverable without competing with operational actions.
  - Scan Workspace promoted as sole filled primary CTA — matches actual first-use workflow.
  - Reordered left-to-right: utility → deemphasised → primary.
duration: ""
verification_result: passed
completed_at: 2026-03-28T22:19:06.478Z
blocker_discovered: false
---

# T01: Established header action hierarchy: demoted dead-end CTA, promoted Scan Workspace as primary, made User Guide a quiet utility link.

**Established header action hierarchy: demoted dead-end CTA, promoted Scan Workspace as primary, made User Guide a quiet utility link.**

## What Happened

Reworked header action cluster. New Project is now a disabled ghost outline button that signals future availability without implying a working flow. User Guide dropped from a filled violet pill to a lightweight muted text link. Scan Workspace is now the clear primary action. Header order is utility \u2192 deemphasised \u2192 primary. All transition-all on header controls replaced with transition-colors. Build passes.

## Verification

npm run build clean. Source grep confirms New Project is disabled with Coming soon title; User Guide is text-slate-400 link; Scan Workspace is bg-blue-600 primary.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build` | 0 | ✅ pass | 3100ms |
| 2 | `grep -n "New Project\|Coming soon\|User Guide\|Scan Workspace" src/App.tsx` | 0 | ✅ pass — all three controls confirmed at correct hierarchy | 150ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/App.tsx`


## Deviations
None.

## Known Issues
None.
