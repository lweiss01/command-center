---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T01: Bootstrap apply endpoint (repo-local actions)

Add POST /api/projects/:id/bootstrap/apply to server.js. Accepts { stepId, componentId } in the body. Looks up the component by id from computeReadiness, validates the action is repo-local (kind: repo-dir or repo-doc), then performs the appropriate action:
- gsd-dir: create .gsd/ directory
- holistic-dir: run `holistic init` in the project root
- gsd-doc-project: create stub .gsd/PROJECT.md
- gsd-doc-requirements: create stub .gsd/REQUIREMENTS.md
- gsd-doc-decisions: create stub .gsd/DECISIONS.md
- gsd-doc-knowledge: create stub .gsd/KNOWLEDGE.md
- gsd-doc-preferences: create stub .gsd/preferences.md
Returns { ok: true, componentId, action, path } on success or { ok: false, error } on failure. Machine-tool kind is rejected with 400 — those are instructions-only.

## Inputs

- `server.js — computeReadiness, component definitions`

## Expected Output

- `POST /api/projects/:id/bootstrap/apply endpoint live and tested via curl/PowerShell`

## Verification

PowerShell: Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/projects/1/bootstrap/apply -Body '{"componentId":"gsd-dir"}' -ContentType application/json — confirm .gsd dir is created in the test project root, response is { ok: true }. Then confirm a machine-tool componentId returns 400.
