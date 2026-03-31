# S05: Bootstrap audit trail + drift signals

**Goal:** Provide durable, user-visible traceability of bootstrap actions and lightweight drift detection signals so every apply action is inspectable and divergences from applied intent surface automatically.
**Demo:** After this: After this: every bootstrap action has an inspectable audit trail (what changed, why, source template, when), and drift warnings appear when repo state diverges from applied setup intent.

## Tasks
- [x] **T01: Added bootstrap_actions audit table and INSERT on every successful apply** — 1. Add CREATE TABLE IF NOT EXISTS bootstrap_actions to the db.exec block:
   - id INTEGER PRIMARY KEY AUTOINCREMENT
   - project_id INTEGER NOT NULL REFERENCES projects(id)
   - component_id TEXT NOT NULL
   - action TEXT NOT NULL  (e.g. 'mkdir', 'write-file', 'holistic-init')
   - stage TEXT NOT NULL  ('repo-local' | 'machine-level')
   - path TEXT  (resultPath from apply)
   - template_id TEXT
   - applied_at TEXT NOT NULL  (ISO timestamp)
   - source_gap TEXT

2. In the POST /api/projects/:id/bootstrap/apply handler, after the successful apply (before the final res.json), insert a row into bootstrap_actions:
   db.prepare(`INSERT INTO bootstrap_actions (project_id, component_id, action, stage, path, template_id, applied_at, source_gap) VALUES (?,?,?,?,?,?,?,?)`).run(project.id, componentId, action, step.stage, resultPath ?? null, step.templateId ?? null, new Date().toISOString(), step.sourceGap ?? null)
   where `step` is looked up from computeBootstrapPlan to get stage/templateId/sourceGap.

3. Log: [bootstrap/audit] recorded project=X component=Y action=Z
  - Estimate: 30m
  - Files: server.js
  - Verify: Apply a bootstrap step via the API (POST /api/projects/:id/bootstrap/apply) and confirm a row appears in bootstrap_actions. Use node -e to query the DB directly.
- [x] **T02: Added /bootstrap/audit endpoint with drift detection and driftCount in plan response** — 1. Add GET /api/projects/:id/bootstrap/audit:
   - Query bootstrap_actions for project_id ordered by applied_at DESC
   - For each row, re-probe the component's current status via computeReadiness
   - If the component was applied but is now missing → drift: true
   - Return: { entries: [{ id, componentId, action, stage, path, templateId, appliedAt, sourceGap, currentStatus, drift }], driftCount: N }
   - Log: [bootstrap/audit] project=X entries=N drift=M

2. Include driftCount in the existing /api/projects/:id/plan response by calling a lightweight version (just the count) so the Bootstrap Plan section can show a drift badge without a separate fetch.
  - Estimate: 35m
  - Files: server.js
  - Verify: GET /api/projects/:id/bootstrap/audit returns entries array and driftCount. Apply a step, then simulate drift by renaming the created file, and confirm drift:true appears for that entry.
- [x] **T03: Added audit trail panel and drift warnings to Bootstrap Plan UI** — 1. Types: add BootstrapAuditEntry { id: number; componentId: string; action: string; stage: string; path: string | null; templateId: string | null; appliedAt: string; sourceGap: string | null; currentStatus: string; drift: boolean } and BootstrapAudit { entries: BootstrapAuditEntry[]; driftCount: number }.
   Add driftCount to BootstrapPlan type (optional, default 0).

2. State: add bootstrapAudit: BootstrapAudit | null, fetched alongside projectPlan (GET /bootstrap/audit called after plan load).

3. Drift badge: in the Bootstrap Plan section header, if driftCount > 0 show a Pill label='N drift' color=C.danger.

4. Drift inline warning: in the step list, if a step's componentId appears in audit entries with drift:true, show a small inline warning below the step title: '⚠ Previously applied — now missing again.' in danger color.

5. Audit trail section: below the step cards, if audit.entries.length > 0, show a collapsible 'Action history' sub-section (collapsed by default, toggled by a small button). Each entry: timestamp (short format), componentId, action, stage pill, path (truncated), drift indicator if drift:true.
  - Estimate: 50m
  - Files: src/App.tsx
  - Verify: Browser: apply a bootstrap step, reload — audit trail shows the entry. Drift warning appears on a step whose applied component is now missing. No console errors.
- [x] **T04: End-to-end verification of audit trail and drift detection — all checks pass** — 1. Start dev server + backend
2. Select paydirt-backend (has repo-local bootstrap gaps)
3. Apply the first step (Initialize GSD directory)
4. Reload project plan — confirm audit trail shows the entry
5. Manually remove the created directory (rm -rf paydirt-backend/.gsd)
6. Reload — confirm drift warning appears on the step and drift badge shows in section header
7. Re-apply the step — audit trail now shows two entries for the same component
8. No console errors throughout
9. Confirm no regressions: other projects unaffected, repo-local flow intact
  - Estimate: 20m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: audit trail entry visible, drift warning visible after manual removal, drift clears after re-apply. No console errors.
