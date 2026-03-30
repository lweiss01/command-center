---
estimated_steps: 10
estimated_files: 1
skills_used: []
---

# T01: Add computeOpenLoops to server.js and wire into plan route

Add a `computeOpenLoops({ milestones, requirements, decisions })` function to server.js (after `computeReadiness`, before the route handlers) and call it in the plan route, adding `openLoops` to the JSON response.

The function signature and logic are fully specified in the slice research. Key implementation details:
- `nextMilestone`: first entry in milestones[] where `status !== 'done'` (milestones are already sorted by the DB query). Return the full milestone object so the UI can display key + title + status.
- `blockedMilestones`: filter milestones where `status === 'blocked'`, map to `{ key: m.externalKey, title: m.title, status: m.status }`.
- `unresolvedRequirements`: filter requirements where `status === 'active'` AND `validation !== 'validated'`, map to `{ key: r.externalKey, title: r.title, owner: r.primaryOwner }`. Note: `status` uses hyphenated values (`out-of-scope`) — these are already normalized by `normalizeRequirementStatus()`.
- `deferredItems`: filter requirements where `status === 'deferred'`, map to `{ key: r.externalKey, title: r.title }`.
- `revisableDecisions`: filter decisions where `d.revisable && d.revisable.toLowerCase().startsWith('yes')`, map to `{ key: d.externalKey, scope: d.scope, decision: d.decision }`. The `revisable` field is freeform text like 'Yes — if…'.
- `summary`: computed object with `{ unresolvedCount, pendingMilestoneCount, blockedCount, deferredCount }` where `pendingMilestoneCount = milestones.filter(m => m.status !== 'done').length`.

In the plan route (~line 2352): call `computeOpenLoops({ milestones, requirements, decisions })` after the existing four interpretation calls, then add `openLoops` to the `res.json({...})` response object.

Verify with node: start the server (if not already running on :3001), then run an inline fetch to assert the response shape.

## Inputs

- `server.js`

## Expected Output

- `server.js`

## Verification

node --input-type=module -e "const res = await fetch('http://localhost:3001/api/projects/1/plan'); const data = await res.json(); const ol = data.openLoops; console.assert(ol.nextMilestone !== null, 'nextMilestone null'); console.assert(ol.summary.unresolvedCount >= 1, 'unresolvedCount 0'); console.assert(ol.deferredItems.length >= 1, 'no deferred'); console.assert(ol.revisableDecisions.length >= 1, 'no revisable'); console.log('OK', JSON.stringify(ol.summary)); process.exit(0);"

## Observability Impact

openLoops field added to /api/projects/:id/plan — unresolvedCount, deferredCount, blockedCount, pendingMilestoneCount and itemized arrays all inspectable via the endpoint.
