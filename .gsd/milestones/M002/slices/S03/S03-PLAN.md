# S03: Workflow readiness detection

**Goal:** Add computeReadiness(project) to server.js that audits the standard workflow stack (GSD dir+docs, Holistic dir+tool, GSD tool, Beads dir), integrates its output into computeWorkflowState and computeNextAction, returns it from the plan route, and renders a readiness panel in the cockpit.
**Demo:** After this: After this: a repo can be audited against the standard stack — GSD, GSD2, Beads, Holistic, repo docs, and callable tools — with missing pieces surfaced clearly.

## Tasks
- [x] **T01: Added computeReadiness(project) to server.js — 10-component workflow stack audit wired into plan route, workflowState evidence, reasons, and nextAction blockers** — Write the computeReadiness(project) function in server.js. It checks file-system presence for repo-local components and calls execFileSync with a short timeout for machine-level tool callability. Integrate it into computeWorkflowState, computeNextAction, and the plan route.

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
  - Estimate: 45m
  - Files: server.js
  - Verify: curl -s http://localhost:3001/api/projects/1/plan > check.json && node -e "const d=require('./check.json'); console.log(d.readiness.overallReadiness, d.readiness.components.length, d.readiness.gaps); process.exit(d.readiness && Array.isArray(d.readiness.components) ? 0 : 1)" && del check.json
- [x] **T02: Added readiness panel to App.tsx — Workflow Readiness section with 10-component audit list, status badge, and gaps visible in cockpit** — Add StackComponent and ReadinessReport TypeScript interfaces to App.tsx, extend ProjectPlan to include readiness, add a getReadinessClassName helper, and render a Readiness panel in the cockpit JSX. Then run end-to-end browser verification.

Steps:
1. In src/App.tsx, after the NextAction interface (~L107), add:
   ```typescript
   interface StackComponent {
     id: string;
     label: string;
     kind: 'repo-doc' | 'machine-tool' | 'repo-dir';
     status: 'present' | 'missing';
     note: string | null;
     required: boolean;
   }
   interface ReadinessReport {
     overallReadiness: 'ready' | 'partial' | 'missing';
     components: StackComponent[];
     gaps: string[];
   }
   ```
2. In the ProjectPlan interface, add `readiness: ReadinessReport;` alongside the existing fields.
3. Add a helper function getReadinessClassName(status: 'ready' | 'partial' | 'missing'): string that returns 'status-fresh' for ready, 'status-stale' for partial, 'status-missing' for missing (reuse existing CSS class pattern from continuity panel).
4. In the JSX where the existing Workflow State, Continuity, and Next Action panels are rendered, add a Readiness panel section after the Workflow State panel. The panel should:
   - Show a section heading 'Workflow Readiness'
   - Show an overall status badge using getReadinessClassName with the overallReadiness value
   - Render each component in a list: show label, a present/missing indicator, and note if present
   - When gaps.length > 0, show a 'Gaps' list with each gap string
   - Guard against null: only render when projectPlan?.readiness exists
5. Run `npx tsc --noEmit` — fix any type errors before proceeding.
6. Start the dev server if not running. Run browser verification: navigate to the cockpit for project 1, assert readiness panel is visible, overall status badge is present, component list renders (>= 1 item visible), zero console errors.
  - Estimate: 30m
  - Files: src/App.tsx
  - Verify: npx tsc --noEmit
