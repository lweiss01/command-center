---
id: S05
parent: M003
milestone: M003
provides:
  - durable bootstrap action log
  - drift signals for applied components
  - collapsible audit trail UI in Bootstrap Plan section
requires:
  - slice: S03
    provides: bootstrap apply endpoint that creates repo-local artifacts
affects:
  []
key_files:
  - server.js
  - src/App.tsx
key_decisions:
  - Audit stored in SQLite bootstrap_actions table — durable across restarts
  - Drift detection re-probes readiness in /bootstrap/audit; plan response uses cached readiness for lightweight driftCount
  - Audit fetched in parallel with plan, non-fatal on failure to avoid blocking plan load
patterns_established:
  - Drift detection pattern: store applied component IDs, re-probe readiness on fetch, compare to derive drift
  - Non-fatal parallel fetch: audit loaded alongside plan via Promise.all with .catch(() => null) guard
observability_surfaces:
  - [bootstrap/audit] server log on fetch with entry count and drift count
  - bootstrap_actions SQLite table queryable directly for debugging
drill_down_paths:
  - .gsd/milestones/M003/slices/S05/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S05/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S05/tasks/T03-SUMMARY.md
  - .gsd/milestones/M003/slices/S05/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T00:53:25.438Z
blocker_discovered: false
---

# S05: Bootstrap audit trail + drift signals

**Bootstrap audit trail with drift detection — every apply action persisted, drift surfaces automatically when components go missing again**

## What Happened

S05 closes the audit loop on bootstrap actions. Every apply call now writes a durable row to bootstrap_actions with full provenance (what, why, when, path, template). The /bootstrap/audit endpoint re-probes readiness to detect drift \u2014 components that were applied but are now missing surface as drift:true. The UI surfaces this at three levels: a drift badge in the section header, a per-step drift pill + inline warning, and a collapsible audit trail showing the full action history. This gives the user traceability for every bootstrap action and an early warning when repo state diverges from applied intent.

## Verification

All 4 tasks complete. Build clean. Browser 4/4 assertions pass. Full drift cycle verified: apply → entry appears → manual removal → drift surfaces → confirmed by browser_assert.

## Requirements Advanced

None.

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

- `server.js` — Added bootstrap_actions table, index on project_id, INSERT on apply, GET /bootstrap/audit endpoint with drift detection, driftCount in plan response
- `src/App.tsx` — Added BootstrapAuditEntry/BootstrapAudit types, driftCount on BootstrapPlan, bootstrapAudit + auditHistoryOpen state, parallel audit fetch, drift badge, per-step drift UI, collapsible audit trail sub-section
