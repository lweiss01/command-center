---
estimated_steps: 26
estimated_files: 1
skills_used: []
---

# T01: Add computeReadiness to server.js and wire into plan route

Write the computeReadiness(project) function in server.js. It checks file-system presence for repo-local components and calls execFileSync with a short timeout for machine-level tool callability. Integrate it into computeWorkflowState, computeNextAction, and the plan route.

Steps:
1. In server.js, add `const { execFileSync } = require('child_process')` if not already imported (check existing imports first — it may already be there).
2. After the existing computeContinuity function (~L1058), add computeReadiness(project) with this logic:
   - `root = project.rootPath`
   - Check each component using fs.existsSync for repo-dir and repo-doc kinds
   - For machine-tool kind, use execFileSync with `process.platform === 'win32' ? 'gsd.cmd' : 'gsd'` and `['--version']`, timeout 2000, stdio 'pipe'; wrap in try/catch — any error = missing
   - Same pattern for holistic tool: `process.platform === 'win32' ? 'holistic.cmd' : 'holistic'`
   - Do NOT shell out for beads — check .beads/ dir only
   - Build components array with this exact set (id, label, kind, status, note, required):
     * { id: 'gsd-dir', label: 'GSD', kind: 'repo-dir', required: true, note: null } — fs.existsSync(path.join(root, '.gsd'))
     * { id: 'gsd-doc-project', label: 'GSD project doc', kind: 'repo-doc', required: true, note: null } — fs.existsSync(path.join(root, '.gsd', 'PROJECT.md'))
     * { id: 'gsd-doc-preferences', label: 'GSD v2 workflow', kind: 'repo-doc', required: false, note: 'Indicates fully initialized v2 setup' } — fs.existsSync(path.join(root, '.gsd', 'preferences.md'))
     * { id: 'gsd-doc-requirements', label: 'GSD requirements', kind: 'repo-doc', required: false, note: null } — REQUIREMENTS.md
     * { id: 'gsd-doc-decisions', label: 'GSD decisions', kind: 'repo-doc', required: false, note: null } — DECISIONS.md
     * { id: 'gsd-doc-knowledge', label: 'GSD knowledge', kind: 'repo-doc', required: false, note: null } — KNOWLEDGE.md
     * { id: 'holistic-dir', label: 'Holistic (repo)', kind: 'repo-dir', required: true, note: null } — .holistic dir
     * { id: 'holistic-tool', label: 'Holistic (tool)', kind: 'machine-tool', required: true, note: null } — execFileSync holistic
     * { id: 'gsd-tool', label: 'GSD (tool)', kind: 'machine-tool', required: true, note: null } — execFileSync gsd
     * { id: 'beads-dir', label: 'Beads', kind: 'repo-dir', required: false, note: null } — .beads dir
   - Build gaps = components.filter(c => c.required && c.status === 'missing').map(c => c.label)
   - overallReadiness logic: if no required component is present → 'missing'; if all required are present → 'ready'; else → 'partial'
   - Return { overallReadiness, components, gaps }
3. In computeWorkflowState signature, add `readiness` parameter alongside `continuity`. Add to evidence array: `{ label: 'Readiness', value: readiness.overallReadiness }`. When `readiness.overallReadiness !== 'ready'` and gaps.length > 0, push to reasons: `Workflow stack is ${readiness.overallReadiness} — ${readiness.gaps.length} component(s) missing: ${readiness.gaps.join(', ')}.`. When `readiness.overallReadiness === 'missing'` and derived phase would otherwise be 'active', force phase = 'blocked'. Do NOT add a new confidence increment — the model is full at 1.0.
4. In computeNextAction signature, add `readiness` parameter. Before the existing continuity.status === 'missing' guard, add: if readiness?.overallReadiness === 'missing' return { action: 'Bootstrap the workflow stack before continuing.', rationale: 'Critical workflow components are absent: ' + readiness.gaps.join(', ') + '.', blockers: readiness.gaps }. If overallReadiness === 'partial' and gaps.length > 0 and the existing logic would otherwise return blockers: [], append gaps to blockers.
5. In the plan route (~L2197), call computeReadiness(validation.project) after computeContinuity. Pass readiness into computeWorkflowState and computeNextAction calls. Add `readiness` to the response JSON object.

## Inputs

- `server.js`

## Expected Output

- `server.js`

## Verification

curl -s http://localhost:3001/api/projects/1/plan > check.json && node -e "const d=require('./check.json'); console.log(d.readiness.overallReadiness, d.readiness.components.length, d.readiness.gaps); process.exit(d.readiness && Array.isArray(d.readiness.components) ? 0 : 1)" && del check.json

## Observability Impact

GET /api/projects/:id/plan now includes readiness.overallReadiness ('ready'|'partial'|'missing'), readiness.components[] with per-component status, and readiness.gaps[]. workflowState.evidence includes a Readiness entry. workflowState.reasons includes gap descriptions when stack is incomplete.
