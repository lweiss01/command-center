# M002/S03 — Workflow Readiness Detection: Research

**Date:** 2026-03-28

## Summary

S03 adds a `computeReadiness(project)` function that audits a repo against the standard workflow stack (GSD, Beads, Holistic, and expected repo-local docs) and returns a structured report of present, missing, and stale components. The result surfaces in a new cockpit panel, feeds evidence into `computeWorkflowState`, and gates `computeNextAction` when critical components are absent.

The work is well-scoped: one new function in `server.js`, one new plan-route field, TypeScript interface additions in `App.tsx`, and a new UI panel. No unfamiliar technology. The primary judgment call is what counts as each component and how gaps affect the existing phase/confidence model.

The key practical finding is that "GSD2" as a distinct binary does not exist on this machine — the installed tool is `gsd-pi@2.58.0` invoked as `gsd`. The GSD vs GSD2 distinction in D001/D004 most likely refers to the presence of `.gsd/preferences.md` (indicating a fully initialized v2 workflow) versus a bare `.gsd/` dir (older or partially initialized). Beads has no global CLI — its presence is indicated by a `.beads/` directory in the repo root.

## Recommendation

Implement `computeReadiness` as a synchronous function that checks file-system presence for repo-local components and uses a shelled `execFileSync` with timeout for machine-level tool callability. Return a flat array of `StackComponent` objects plus a `overallReadiness` summary string. Integrate into the plan route, wire evidence and blockers into the existing interpretation functions, and render a dedicated readiness panel in App.tsx.

Do not rebalance the confidence formula — it already maxes at 1.0 with five named increments (KNOWLEDGE.md rule). Instead, add readiness gaps as additional `reasons[]` entries and a `Readiness` evidence item in `computeWorkflowState`. Reserve phase mutation (pushing to 'blocked') for the case where zero stack components are present.

## Implementation Landscape

### Key Files

- `server.js` (2261 lines) — add `computeReadiness(project)` alongside the three existing interpretation functions (~L797–L1058). Wire it into the `/api/projects/:id/plan` route (~L2181) alongside the existing `computeContinuity` / `computeWorkflowState` / `computeNextAction` calls. Return `readiness` in the response JSON.
- `src/App.tsx` — add `ReadinessReport` and `StackComponent` interfaces (alongside existing ~L88–L131 interfaces). Add a readiness panel section in the JSX (alongside the existing Workflow State, Continuity, and Next Action panels). Add a `getReadinessClassName` helper.

### Standard Stack Components to Check

| Component | Kind | Check Logic |
|-----------|------|-------------|
| GSD (present) | `repo-dir` | `fs.existsSync(path.join(root, '.gsd'))` |
| GSD initialized | `repo-doc` | `.gsd/PROJECT.md` exists |
| GSD v2 workflow | `repo-doc` | `.gsd/preferences.md` exists — distinguishes bare init from full v2 setup |
| GSD requirements | `repo-doc` | `.gsd/REQUIREMENTS.md` exists |
| GSD decisions | `repo-doc` | `.gsd/DECISIONS.md` exists |
| GSD knowledge | `repo-doc` | `.gsd/KNOWLEDGE.md` exists |
| Holistic (repo) | `repo-dir` | `fs.existsSync(path.join(root, '.holistic'))` |
| Holistic (tool) | `machine-tool` | `execFileSync('holistic', ['--version'], {timeout:3000})` — present on this machine |
| GSD (tool) | `machine-tool` | `execFileSync('gsd', ['--version'], {timeout:3000})` — present on this machine |
| Beads (repo) | `repo-dir` | `fs.existsSync(path.join(root, '.beads'))` — no global Beads CLI exists |

**Important**: `beads` has no global CLI. The only valid check is the `.beads/` repo directory. Do not try to shell out `beads --version` — it will fail on every machine.

Real repo readiness examples (surveyed):
- `newsthread`: `.gsd/` + `.holistic/` + `.beads/` — but missing REQUIREMENTS.md, KNOWLEDGE.md, preferences.md → partial
- `filetrx`: no `.gsd/` + `.holistic/` + `.beads/` → missing GSD entirely → partial
- `paydirt`: `.gsd/` full (has preferences.md, REQUIREMENTS.md, DECISIONS.md) + `.holistic/` → ready (no Beads, but that's optional)
- `paydirt-backend`: no `.gsd/`, no `.holistic/` → missing
- `command-center`: full `.gsd/` + `.holistic/` + no `.beads/` → ready

### Return Shape

```typescript
interface StackComponent {
  id: string;           // e.g. 'gsd-dir', 'holistic-tool', 'beads-dir'
  label: string;        // e.g. 'GSD', 'Holistic (tool)', 'Beads'
  kind: 'repo-doc' | 'machine-tool' | 'repo-dir';
  status: 'present' | 'missing';
  note: string | null;  // optional clarifying note
  required: boolean;    // if false, missing is informational not a gap
}

interface ReadinessReport {
  overallReadiness: 'ready' | 'partial' | 'missing';
  components: StackComponent[];
  gaps: string[];       // human-readable strings for missing required components
}
```

`overallReadiness` logic:
- `missing` → zero required components present (no `.gsd/`, no `.holistic/`)
- `ready` → all required components present (`gsd-dir`, `gsd-doc-project`, `holistic-dir`, `holistic-tool`)
- `partial` → otherwise

Required vs optional:
- Required: `.gsd/` dir, `.gsd/PROJECT.md`, `.holistic/` dir, `holistic` machine tool, `gsd` machine tool
- Optional/informational: `preferences.md`, REQUIREMENTS.md, DECISIONS.md, KNOWLEDGE.md, `.beads/` dir

### Integration Points in `computeWorkflowState`

Accept `readiness` as a new parameter alongside `continuity`. Add to evidence:
```js
evidence.push({ label: 'Readiness', value: readiness.overallReadiness });
```
Add to reasons when `overallReadiness !== 'ready'`:
```js
reasons.push(`Workflow stack is ${readiness.overallReadiness} — ${readiness.gaps.length} components missing.`);
```
If `overallReadiness === 'missing'` and `phase` would otherwise be `active`, force `phase = 'blocked'`.

Do NOT add a new confidence increment — the formula already totals to 1.0. Surface readiness gaps through `reasons[]` and the dedicated readiness panel instead.

### Integration Points in `computeNextAction`

Add a check before the existing `continuity.status === 'missing'` guard:
```js
if (readiness?.overallReadiness === 'missing') {
  return {
    action: 'Bootstrap the workflow stack before continuing.',
    rationale: 'Critical workflow components are absent ...',
    blockers: readiness.gaps,
  };
}
```
If `overallReadiness === 'partial'` and `gaps.length > 0`, add `gaps` as additional blockers when there are no more urgent blockers already set.

### Build Order

1. **T01 — `computeReadiness` function + plan route** — pure server-side, no UI. Verify with `curl /api/projects/1/plan` checking `readiness` key in response. This unblocks T02 and T03.
2. **T02 — Integrate readiness into `computeWorkflowState` and `computeNextAction`** — wire new parameter, add evidence item, add phase mutation for `missing` readiness, add gaps as blockers in nextAction. Verify via API response.
3. **T03 — Render readiness panel in App.tsx + browser verification** — add interfaces, helper, and JSX panel. Run end-to-end browser verification (TypeScript compile + browser assertions).

### Verification Approach

- `npx tsc --noEmit` → exit 0 after each task
- `node -e "import('./server.js')"` → server starts cleanly
- `curl http://localhost:3001/api/projects/1/plan | node -e "..."` → readiness key present with components array
- Browser: readiness panel visible, component list renders, overall status badge correct, zero console errors

## Common Pitfalls

- **`execFileSync` on Windows with `gsd` or `holistic`** — on Windows the binary is `gsd.cmd` not `gsd`. Use `process.platform === 'win32' ? 'gsd.cmd' : 'gsd'` pattern, or just wrap in try/catch and treat any error as "not found". Set a short `timeout` (2000ms) and `stdio: 'pipe'` to suppress output.
- **Beads global CLI does not exist** — do not shell out `beads --version`. Check `.beads/` dir only.
- **Confidence model is full at 1.0** — the existing five increments sum to exactly 1.0. Do not add a new confidence increment without rebalancing — and KNOWLEDGE.md says not to change the model. Route readiness signal through `reasons[]`, `evidence[]`, and phase mutation instead.
- **GSD2 does not exist as a distinct binary** — `gsd-pi@2.58.0` is the current tool. The v2 distinction is repo-local: check for `preferences.md` as an optional informational component, not as a hard requirement.

## Sources

None needed — all information derived from live repo inspection and the existing codebase.
