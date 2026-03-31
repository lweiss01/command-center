---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T03: Add audit trail panel and drift warnings to Bootstrap Plan UI

1. Types: add BootstrapAuditEntry { id: number; componentId: string; action: string; stage: string; path: string | null; templateId: string | null; appliedAt: string; sourceGap: string | null; currentStatus: string; drift: boolean } and BootstrapAudit { entries: BootstrapAuditEntry[]; driftCount: number }.
   Add driftCount to BootstrapPlan type (optional, default 0).

2. State: add bootstrapAudit: BootstrapAudit | null, fetched alongside projectPlan (GET /bootstrap/audit called after plan load).

3. Drift badge: in the Bootstrap Plan section header, if driftCount > 0 show a Pill label='N drift' color=C.danger.

4. Drift inline warning: in the step list, if a step's componentId appears in audit entries with drift:true, show a small inline warning below the step title: '⚠ Previously applied — now missing again.' in danger color.

5. Audit trail section: below the step cards, if audit.entries.length > 0, show a collapsible 'Action history' sub-section (collapsed by default, toggled by a small button). Each entry: timestamp (short format), componentId, action, stage pill, path (truncated), drift indicator if drift:true.

## Inputs

- `src/App.tsx — existing bootstrap plan section`
- `server.js — /bootstrap/audit endpoint from T02`

## Expected Output

- `src/App.tsx with audit trail panel and drift warnings`

## Verification

Browser: apply a bootstrap step, reload — audit trail shows the entry. Drift warning appears on a step whose applied component is now missing. No console errors.
