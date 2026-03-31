---
estimated_steps: 14
estimated_files: 1
skills_used: []
---

# T01: Add bootstrap_actions audit table and record on apply

1. Add CREATE TABLE IF NOT EXISTS bootstrap_actions to the db.exec block:
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

## Inputs

- `server.js — existing apply handler and DB setup`

## Expected Output

- `server.js with bootstrap_actions table and insert on apply`

## Verification

Apply a bootstrap step via the API (POST /api/projects/:id/bootstrap/apply) and confirm a row appears in bootstrap_actions. Use node -e to query the DB directly.
