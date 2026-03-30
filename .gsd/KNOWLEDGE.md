# Knowledge Register

<!-- Append-only. Never edit or remove existing entries.
     Add entries when you discover a recurring issue, a non-obvious pattern,
     or a rule that future agents should follow. Skip obvious observations. -->

## M002/S01 — Workflow interpretation contract

### computeWorkflowState confidence is additive fixed-increment, not weighted
Each signal adds a fixed amount (milestone +0.15, requirements +0.20, decisions +0.10, import recency up to +0.25, continuity freshness up to +0.30). No scoring formula — just named increments. Keep it this way: the design intent is "explainable and conservative." Adding weighted averages or ML-style scoring would break the philosophy.

### latestImportRunsByArtifact must be forwarded into computeWorkflowState
The plan route assembles `latestImportRunsByArtifact` but at M001 completion it was not passed into `computeWorkflowState`. T02 fixed this. Any future route refactor that removes this forwarding will silently break import-recency-based phase detection ('stalled' vs 'active' distinction).

### checkpointHygiene is derived from lastCheckpointAt/lastHandoffAt in Holistic state.json
Not from freshness or the top-level `lastUpdated`. Both keys are optional in the state file — if neither is present, hygiene is 'missing'. If present, hygiene is 'stale' if older than 24h (or the configured staleness threshold).

### Three continuity statuses only — no 'aging' middle value
The continuity status is 'fresh' | 'stale' | 'missing'. The prior implementation had ambiguous string values; adding an 'aging' or 'ok' variant was considered and rejected. Keep the contract to three values; derive display distinctions in the UI layer.

### T05 was a verification-only task — upstream tasks did the rendering
If T05 appears to have no code diff, that is expected. T02/T03/T04 each updated App.tsx rendering as part of their scope. T05 confirmed end-to-end browser correctness without needing additional code changes.

### Windows: /tmp and /dev/stdin do not exist — use cwd-relative temp files
Node.js on Windows does not support `/tmp/` or `/dev/stdin`. When piping curl output for node inspection, write to a file in the working directory (e.g. `check.json`) and delete it after. All temp files must be cwd-relative.

## M002/S02 — Continuity and checkpoint hygiene

### Holistic checkpoint key-path correction (supersedes S01 note above)
The S01 KNOWLEDGE entry says hygiene is derived from `lastCheckpointAt/lastHandoffAt` in state.json. That is wrong — those keys do not exist at the top level. The real path is `holisticState.passiveCapture?.lastCheckpointAt` (primary) with `holisticState.lastAutoCheckpoint` as fallback. Any future change to computeContinuity must target these paths, not the top-level ones.

### handoffCommand belongs in the server's continuity struct, not the UI
The platform detection (`process.platform === 'win32'`) and command string assembly live in `computeContinuity` in server.js. The UI renders whatever string it receives. This prevents the front-end from needing to know about platform differences. All three return branches of `computeContinuity` must include `handoffCommand` — a missing branch causes shape inconsistency that TypeScript may not catch at the call site.

### stale continuity + ok hygiene is a soft reminder, not a blocker
If `continuity.freshness === 'stale'` but `continuity.checkpointHygiene === 'ok'` or `'stale'`, `computeNextAction` should NOT push a hard blocker. A hard blocker is only warranted for `stale + missing` hygiene. The distinction matters: repos with recent passive captures should still get actionable next-step guidance, not a red wall telling the user to checkpoint first.

### T03 was a verification-only task — upstream tasks did the UI work
T01 and T02 built all logic and rendering changes. T03 confirmed browser-level correctness without code changes. This is expected and mirrors the S01/T05 pattern. Don't re-examine T03's diff expecting code — there was none.

## M002/S04 — Repo drill-down for open loops

### computeOpenLoops follows the same pure-function pattern as all other interpretation functions
Takes `{ milestones, requirements, decisions }`, returns a derived shape, called after the other four interpretation functions in the plan route. No side effects, no DB calls. If a future agent needs to add a sixth interpretation signal, follow this pattern: pure function above the route handlers, called inline in the route, key added to `res.json({...})`.

### revisableDecisions filter uses freeform text normalization
The `revisable` field in decisions is freeform (e.g. 'Yes — if…', 'Yes', 'No'). The filter is `d.revisable && d.revisable.toLowerCase().startsWith('yes')`. Do not change this to a strict equality check — the field was designed for human-readable text, not enum values.

### unresolvedRequirements: 'active' + not 'validated' — two conditions required
The filter is `status === 'active' AND validation !== 'validated'`. Requirements with `status === 'active'` but `validation === 'validated'` are NOT unresolved — they are active-but-proven. This distinction matters: the count displayed as "unresolved" excludes already-proven active requirements.

## M002/S03 — Workflow readiness detection

### computeReadiness uses execFileSync (not execa or child_process.exec) with strict timeout
The tool-callability probe uses `execFileSync` (ES import from 'child_process') with `timeout: 2000` and `stdio: 'pipe'`. Any error including ENOENT, timeout, or non-zero exit is treated as 'missing'. This is intentional — a tool that partially works (e.g. wrong version) is treated the same as absent. Do not replace with async exec without updating the surrounding synchronous flow.

### Readiness guard fires before continuity guard in computeNextAction
The `overallReadiness === 'missing'` check is the hardest constraint and fires first. If the entire workflow stack is absent, the user should be told to bootstrap before anything else. Continuity is a softer concern and runs second. Don't reorder these guards — reversing them would surface stale-continuity messages for repos with no workflow stack at all.

### ES module import { execFileSync } — not CommonJS require
server.js uses ES modules (`import` / `export`). When adding child_process usage, use `import { execFileSync } from 'child_process'`, not `const { execFileSync } = require('child_process')`. The require form silently breaks at runtime in an ESM file — the error message is not always obvious.

### overallReadiness logic: 'missing' requires zero required components present
`overallReadiness === 'missing'` means no required component is present (not just all missing). If even one required component is present, the status is 'partial'. This means a repo with only `.gsd/` (no Holistic, no tools) is 'partial', not 'missing'. Only a completely bare repo with nothing gets 'missing'. Keep this asymmetry — it avoids false alarm for the common partial-setup case.

### Confidence model is already capped — readiness adds no confidence increment
The additive confidence model reaches 1.0 with all other signals present. computeReadiness intentionally adds no confidence increment per the plan spec. Readiness affects phase ('blocked' override), evidence[], reasons[], and nextAction blockers — but not the numeric confidence score. Adding a confidence increment would exceed 1.0 or require renormalizing all other increments.

## M002/S05 — Cross-repo prioritization view

### toolOverrides pattern prevents O(N) execFileSync calls in the portfolio route
computeReadiness accepts an optional `toolOverrides?: { holisticStatus: 'present' | 'missing'; gsdStatus: 'present' | 'missing' }`. When provided, those values replace the execFileSync probes. The portfolio route must probe holistic/gsd tool availability once at handler entry and pass the result via toolOverrides for every per-project call. Forgetting to pass toolOverrides will cause N subprocess calls per portfolio fetch — slow and noisy.

### serializeProjectRow returns camelCase rootPath but interpretation functions expect snake_case root_path
serializeProjectRow maps the DB column `root_path` to camelCase `rootPath` in the returned object. Interpretation functions (computeContinuity, computeReadiness, etc.) access `project.root_path` in snake_case directly. The portfolio route must reconstruct a `{ ...project, root_path: project.rootPath }` object before passing to interpretation functions, or they silently read undefined root paths.

### filteredProjects useMemo must spread before sort to avoid mutating filtered array in place
Array.sort() mutates in place. If filteredProjects spreads into a new array before sorting (`[...filtered].sort(...)`) the original filtered reference is not mutated. Skipping the spread causes stale sort order on re-renders when the sort mode changes because React may cache the previous reference.

## M002/S07 — One-click local launcher

### Windows launcher scripts should resolve both `pwsh` and `powershell`
Some environments do not expose `pwsh` even on Windows. Startup/shortcut scripts must detect `pwsh` first and fall back to `powershell`, or launcher automation fails with a command-not-found error.

### Frontend launch must use strict Vite port for deterministic readiness checks
For one-click startup, run frontend as `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Without `--strictPort`, Vite can hop ports silently, making readiness probes and browser-open behavior inconsistent.

### Launcher should tee service output to repo-local logs for failure diagnosis
When startup times out, users need immediate diagnostics. Writing backend/frontend output to `.logs/command-center-backend.log` and `.logs/command-center-frontend.log` turns startup failures into inspectable artifacts instead of opaque launcher errors.

## M003 scoping — deferred work

### Repo-doc authoring belongs in a post-M003 milestone
Helping users author the *content* of planning docs (`.gsd/PROJECT.md`, `REQUIREMENTS.md`, `KNOWLEDGE.md`, etc.) for repos that are missing them was considered for M003 and explicitly deferred. M003 covers workflow stack bootstrapping (tools + config presence) only. A dedicated authoring-assistance milestone should pick this up — the intent is guided content creation, not just file presence checks.
