---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T02: Preflight wiring + conflict warning + undo hint UI

Wire preflight into the Apply flow in App.tsx.

1. Add a preflightResult state per step: Map<stepId, { conflict: boolean, conflictDetail: string|null, wouldCreate: string|null } | null>. Initialize to null (not yet run).

2. Change Apply button onClick: instead of immediately setting status to 'confirming', first call the preflight endpoint. On response:
   - Store the preflight result in preflightResult map
   - Set step status to 'confirming' as before
   The confirmation panel will then render the preflight result.

3. In the confirmation panel, if preflightResult for this step has conflict:true, show a yellow warning block above the file preview: 'Conflict detected: <conflictDetail>. You can still proceed — the existing file will be overwritten.'

4. Add lastApplyUndo state: string | null. After successful apply (in handleBootstrapConfirm), set it to a short undo string based on the wouldCreate path from the preflight result:
   - Directory: 'To undo: rmdir "<path>"'
   - File: 'To undo: del "<path>"' (Windows) or use a generic phrasing
   Actually: keep it platform-agnostic: 'To undo: delete <path>'

5. Show lastApplyUndo as a small note near the Bootstrap Plan header (below the pills row, above the stage cards), styled as a muted mono line with an × dismiss button. Cleared on project switch or when dismissed.

Clear preflightResult for a step on Cancel or when step state resets.

## Inputs

- `src/App.tsx — Apply button handler, confirmation panel, bootstrap state`
- `T01 output: preflight endpoint`

## Expected Output

- `Conflict warning visible in confirmation panel when target file exists`
- `Undo hint shown after successful apply`

## Verification

Browser: manually create a file at a target path, click Apply, confirm yellow conflict warning appears in panel. Apply proceeds, undo hint shown. Dismiss button clears hint.
