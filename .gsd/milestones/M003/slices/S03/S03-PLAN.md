# S03: Safe apply engine + approval gates

**Goal:** Add a preflight safety check before any bootstrap apply: detect if the target file/dir already exists (conflict), verify the parent directory is accessible, and surface a clear warning in the confirmation panel. After a successful apply, show a one-line undo hint so users know exactly how to reverse the action.
**Demo:** After this: After this: approved repo-local bootstrap actions can be applied with dry-run preview, rollback guidance, and explicit confirmations for higher-risk mutations.

## Tasks
- [x] **T01: Implemented preflight safety check endpoint in server.js.** — Add GET /api/projects/:id/bootstrap/preflight endpoint to server.js.

Accepts ?componentId=<id> as a query param.

For each componentId, determine:
- wouldCreate: the absolute path that would be created (file or dir)
- conflict: whether that path already exists
- conflictDetail: human-readable description if conflict (e.g. 'File already exists at .gsd/PROJECT.md — applying will overwrite it')
- parentWritable: whether the parent directory is accessible (use fs.accessSync with W_OK on the parent)
- safe: true if no conflict AND parentWritable; false otherwise

For machine-tool components: return { safe: false, wouldCreate: null, conflict: false, conflictDetail: 'Machine-level tools cannot be preflight-checked', parentWritable: false }

For gsd-dir / holistic-dir: check if the directory already exists.
For gsd-doc-*: check if the file already exists.

Return shape: { ok: true, componentId, wouldCreate, conflict, conflictDetail, parentWritable, safe }

Log: [bootstrap/preflight] project=X component=Y conflict=true/false
  - Estimate: 30m
  - Files: server.js
  - Verify: curl 'http://localhost:3001/api/projects/2/bootstrap/preflight?componentId=gsd-dir' after .gsd exists in filetrx — should return conflict:true. curl same endpoint for a missing component — should return conflict:false, safe:true.
- [x] **T02: Wired preflight check and conflict warning UI in App.tsx.** — Wire preflight into the Apply flow in App.tsx.

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
  - Estimate: 50m
  - Files: src/App.tsx
  - Verify: Browser: manually create a file at a target path, click Apply, confirm yellow conflict warning appears in panel. Apply proceeds, undo hint shown. Dismiss button clears hint.
- [x] **T03: Performed end-to-end browser verification of the preflight and conflict warning flow.** — End-to-end browser verification:
1. Find a project with a bootstrap gap for a doc file
2. Manually create the target file to simulate a conflict
3. Click Apply on that step — preflight fires, confirmation panel shows yellow conflict warning
4. Click Confirm anyway — file is overwritten, undo hint shown
5. Click × on undo hint — hint clears
6. Find a non-conflict step — Apply opens confirmation with no warning
7. No console errors
  - Estimate: 20m
  - Verify: browser_assert: conflict warning visible after creating conflicting file. Undo hint visible after apply. No console errors.
