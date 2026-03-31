# S04: Machine-level setup assistant (secondary stage)

**Goal:** Add a machine-level setup assistant as a secondary bootstrap stage: OS-aware install commands, clipboard copy, a "verify install" round-trip that re-probes tool presence, and a stage gate that prompts users to complete repo-local steps first.
**Demo:** After this: After this: when repo-local setup is complete but tools are missing, Command Center offers machine-level setup instructions/assisted commands with strict confirmation boundaries.

## Tasks
- [x] **T01: Added verify-tool endpoint and OS-aware install commands to server.js** — 1. In computeBootstrapPlan (server.js), expand the component meta table to include platform-aware install command variants:
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
  - Estimate: 40m
  - Files: server.js
  - Verify: curl 'http://localhost:3001/api/projects/2/bootstrap/verify-tool?componentId=gsd-tool' — should return { ok:true, componentId:'gsd-tool', status:'present'|'missing' }. Check plan response includes platform field and installCommands on machine-level steps.
- [x] **T02: Updated instructions panel with clipboard copy, verify button, multi-variant tabs, and stage gate** — 1. Types: extend BootstrapStep to include `installCommands?: { npm?: string; brew?: string; winget?: string }`. Add platform to ProjectPlan type.

2. Clipboard copy: in the instructions panel, add a small 'Copy' button next to the install command code block. On click, call navigator.clipboard.writeText(step.instructions). Show a transient 'Copied!' label (reset after 2s via setTimeout).

3. Verify button: add a new StepStatus value 'verifying'. In the instructions panel, alongside Dismiss, add a 'I installed this — verify' button. On click:
   - Set step status to 'verifying'
   - GET /api/projects/:id/bootstrap/verify-tool?componentId=step.componentId
   - On status:'present' → set step status to 'done'
   - On status:'missing' → set step status to 'instructions' and show an inline error: 'Tool not detected yet — try running the install command, then verify again.'
   - On network error → set step status to 'instructions' + show error

4. Multi-variant display: if step.installCommands has more than one variant, show a small tab row (npm / brew / winget) above the command block. Active tab highlights the platform-native command (derived from plan.platform). Clicking a tab switches the displayed command. The Copy button copies the currently shown command.

5. Stage gate: above the machine-level stage card, check if any repo-local step has status !== 'done'. If yes, render a muted banner: 'Complete repo-local steps above before running machine-level setup.' Disable 'View Instructions' buttons on pending machine-level steps (grey out + cursor:not-allowed) when the gate is active.
  - Estimate: 60m
  - Files: src/App.tsx
  - Verify: Browser: instructions panel shows Copy button — click copies to clipboard. 'I installed this — verify' triggers verify endpoint. Stage gate banner appears when repo-local steps are pending; disappears once all repo-local steps are done. Verify button shows 'still missing' error when tool is absent. No regressions to repo-local apply/confirm flow.
- [x] **T03: End-to-end browser verification of machine-level assistant — all checks pass** — End-to-end browser verification:
1. Start dev server and backend, navigate to Command Center
2. Select a project that has machine-level gaps (holistic-tool or gsd-tool missing)
3. Verify machine-level stage card is present and stage gate banner shows if repo-local steps are pending
4. Complete or dismiss repo-local steps — confirm stage gate banner disappears
5. Click 'View Instructions' on a machine-level step — panel opens with correct install command
6. Click Copy — browser clipboard API called (assert no console error)
7. Click 'I installed this — verify' — verify endpoint called, result shown correctly
8. Check multi-variant tabs if more than one command variant available
9. No console errors throughout
  - Estimate: 20m
  - Files: src/App.tsx, server.js
  - Verify: browser_assert: stage gate banner visible when repo-local pending. Instructions panel renders. Verify button triggers network request. No console errors.
