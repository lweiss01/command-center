---
estimated_steps: 10
estimated_files: 1
skills_used: []
---

# T02: Update instructions panel: clipboard copy, verify button, stage gate

1. Types: extend BootstrapStep to include `installCommands?: { npm?: string; brew?: string; winget?: string }`. Add platform to ProjectPlan type.

2. Clipboard copy: in the instructions panel, add a small 'Copy' button next to the install command code block. On click, call navigator.clipboard.writeText(step.instructions). Show a transient 'Copied!' label (reset after 2s via setTimeout).

3. Verify button: add a new StepStatus value 'verifying'. In the instructions panel, alongside Dismiss, add a 'I installed this — verify' button. On click:
   - Set step status to 'verifying'
   - GET /api/projects/:id/bootstrap/verify-tool?componentId=step.componentId
   - On status:'present' → set step status to 'done'
   - On status:'missing' → set step status to 'instructions' and show an inline error: 'Tool not detected yet — try running the install command, then verify again.'
   - On network error → set step status to 'instructions' + show error

4. Multi-variant display: if step.installCommands has more than one variant, show a small tab row (npm / brew / winget) above the command block. Active tab highlights the platform-native command (derived from plan.platform). Clicking a tab switches the displayed command. The Copy button copies the currently shown command.

5. Stage gate: above the machine-level stage card, check if any repo-local step has status !== 'done'. If yes, render a muted banner: 'Complete repo-local steps above before running machine-level setup.' Disable 'View Instructions' buttons on pending machine-level steps (grey out + cursor:not-allowed) when the gate is active.

## Inputs

- `src/App.tsx`
- `server.js`

## Expected Output

- `src/App.tsx updated with clipboard copy, verify flow, multi-variant tabs, stage gate`

## Verification

Browser: instructions panel shows Copy button — click copies to clipboard. 'I installed this — verify' triggers verify endpoint. Stage gate banner appears when repo-local steps are pending; disappears once all repo-local steps are done. Verify button shows 'still missing' error when tool is absent. No regressions to repo-local apply/confirm flow.
