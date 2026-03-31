---
estimated_steps: 15
estimated_files: 1
skills_used: []
---

# T01: Add verify-tool endpoint and OS-aware install commands to server.js

1. In computeBootstrapPlan (server.js), expand the component meta table to include platform-aware install command variants:
   - holistic-tool: { npm: 'npm install -g @holistic-ai/holistic', brew: 'brew install holistic', winget: null }
   - gsd-tool: { npm: 'npm install -g @anthropic/gsd', brew: null, winget: null }
   Add a helper selectInstallCommand(meta, platform) that picks:
   - Windows → winget variant if present, else npm variant
   - macOS → brew variant if present, else npm variant
   - Linux → npm variant
   Attach `instructions` (string) and `installCommands` (object with all variants) to each machine-level step.

2. Add GET /api/projects/:id/bootstrap/verify-tool?componentId=<id>
   - Look up the component in the readiness components list for this project (call computeReadiness)
   - If the component is not of kind 'machine-tool', return 400 { ok: false, error: 'Not a machine-tool component' }
   - Re-probe tool presence using the same execFileSync approach as computeReadiness
   - Return { ok: true, componentId, status: 'present' | 'missing' }
   - Log: [bootstrap/verify-tool] project=X component=Y result=present|missing

3. Include `platform` (process.platform) in the /api/projects/:id/plan response so the frontend knows which variant to highlight.

## Inputs

- `server.js`
- `.gsd/milestones/M003/slices/S03/S03-SUMMARY.md`

## Expected Output

- `server.js updated with verify-tool endpoint and OS-aware install commands`
- `plan response includes platform and installCommands`

## Verification

curl 'http://localhost:3001/api/projects/2/bootstrap/verify-tool?componentId=gsd-tool' — should return { ok:true, componentId:'gsd-tool', status:'present'|'missing' }. Check plan response includes platform field and installCommands on machine-level steps.
