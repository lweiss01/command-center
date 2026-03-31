---
id: T02
parent: S01
milestone: M005
provides: []
requires: []
affects: []
key_files: ["server.js"]
key_decisions: ["Priority 3 (stale+missing hygiene) is separate from priority 8 (stale+ok hygiene) — different severity levels for the same stale continuity root cause", "importAgeDays>14 threshold chosen (not 7) to avoid noise on repos that import weekly"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "node inline test: command-center queue empty, paydirt-backend queue has 3 items with critical at top."
completed_at: 2026-03-31T15:59:31.910Z
blocker_discovered: false
---

# T02: Wrote computeRepairQueue — 8-priority repair list with severity and target panel

> Wrote computeRepairQueue — 8-priority repair list with severity and target panel

## What Happened
---
id: T02
parent: S01
milestone: M005
key_files:
  - server.js
key_decisions:
  - Priority 3 (stale+missing hygiene) is separate from priority 8 (stale+ok hygiene) — different severity levels for the same stale continuity root cause
  - importAgeDays>14 threshold chosen (not 7) to avoid noise on repos that import weekly
duration: ""
verification_result: passed
completed_at: 2026-03-31T15:59:31.917Z
blocker_discovered: false
---

# T02: Wrote computeRepairQueue — 8-priority repair list with severity and target panel

**Wrote computeRepairQueue — 8-priority repair list with severity and target panel**

## What Happened

Wrote computeRepairQueue with 8 priority checks. Returns items sorted by priority (1=most urgent). Each item has priority, severity, action string, rationale, and targetPanel for UI linking.

## Verification

node inline test: command-center queue empty, paydirt-backend queue has 3 items with critical at top.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node inline test against real API data` | 0 | ✅ pass — command-center:0 items, paydirt-backend: critical+high+medium | 200ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `server.js`


## Deviations
None.

## Known Issues
None.
